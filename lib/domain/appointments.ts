import { createHash, randomBytes } from "crypto";
import { writeAudit } from "@/lib/audit";
import type { StaffSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import type { TxQuery } from "@/lib/dbTx";
import { withTx } from "@/lib/dbTx";
import { DomainError } from "@/lib/http";
import { enqueueForAppointment } from "@/lib/messaging/queue";
import { addDaysToDateKey, addMonthsToDateKey, formatDate, formatHm, parseClinicDateTime, zonedTimeToUtc } from "@/lib/scheduling/time";
import { emitWebhook } from "@/lib/webhooks/emit";

const STATUSES = ["booked", "confirmed", "arrived", "completed", "cancelled", "no_show"] as const;

export type AppointmentInput = {
  patientId?: string | null;
  serviceId?: string | null;
  staffUserId: string;
  locationId: string;
  roomId?: string | null;
  startsAt: string;
  endsAt?: string | null;
  durationMinutes?: number | null;
  allDay?: boolean;
  status?: string;
  price?: number | null;
  notes?: string | null;
  bookedOnline?: boolean;
  recurrence?: {
    freq: "DAILY" | "WEEKLY" | "MONTHLY";
    interval?: number;
    count?: number;
    until?: string | null;
  } | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function resolveWindow(input: AppointmentInput) {
  const starts = new Date(input.startsAt);
  if (Number.isNaN(starts.getTime())) throw new DomainError("Fecha de inicio inválida.");
  let duration = input.durationMinutes ?? null;
  let price = input.price ?? null;
  if (input.serviceId && (duration == null || price == null)) {
    const svc = await query<{ duration_minutes: number; price: string }>(
      `SELECT duration_minutes, price FROM services WHERE id = $1`,
      [input.serviceId]
    );
    if (!svc.rows[0]) throw new DomainError("Servicio no encontrado.");
    duration = duration ?? svc.rows[0].duration_minutes;
    price = price ?? Number(svc.rows[0].price);
  }
  duration = duration ?? 30;
  const ends = input.endsAt ? new Date(input.endsAt) : new Date(starts.getTime() + duration * 60000);
  if (Number.isNaN(ends.getTime()) || ends <= starts) throw new DomainError("El horario de fin no es válido.");
  const status = input.status && STATUSES.includes(input.status as (typeof STATUSES)[number]) ? input.status : "booked";
  return { starts, ends, duration, price, status };
}

const SELECT = `
  SELECT a.*,
         p.first_name AS patient_first_name, p.last_name AS patient_last_name,
         s.name AS service_name, s.color AS service_color,
         u.first_name AS staff_first_name, u.last_name AS staff_last_name, u.calendar_color,
         r.name AS room_name, l.name AS location_name, l.timezone
  FROM appointments a
  LEFT JOIN patients p ON p.id = a.patient_id
  LEFT JOIN services s ON s.id = a.service_id
  LEFT JOIN staff_users u ON u.id = a.staff_user_id
  LEFT JOIN rooms r ON r.id = a.room_id
  LEFT JOIN locations l ON l.id = a.location_id
`;

export function mapAppointment(row: Record<string, unknown>, manageToken?: string) {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_first_name ? `${row.patient_first_name} ${row.patient_last_name}` : null,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceColor: row.service_color,
    staffUserId: row.staff_user_id,
    staffName: `${row.staff_first_name ?? ""} ${row.staff_last_name ?? ""}`.trim(),
    staffColor: row.calendar_color,
    locationId: row.location_id,
    locationName: row.location_name,
    timezone: row.timezone,
    roomId: row.room_id,
    roomName: row.room_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    allDay: row.all_day,
    status: row.status,
    price: row.price == null ? null : Number(row.price),
    notes: row.notes,
    bookedOnline: row.booked_online,
    recurrenceId: row.recurrence_id,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
    manageToken: manageToken ?? null,
  };
}

async function insertOne(
  q: TxQuery,
  input: AppointmentInput,
  window: Awaited<ReturnType<typeof resolveWindow>>,
  actorId: string | null,
  recurrenceId: string | null,
  manageToken: string | null
) {
  const inserted = await q(
    `INSERT INTO appointments (
       patient_id, service_id, staff_user_id, location_id, room_id, starts_at, ends_at,
       duration_minutes, all_day, status, price, notes, booked_online, recurrence_id,
       manage_token_hash, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [
      input.patientId ?? null,
      input.serviceId ?? null,
      input.staffUserId,
      input.locationId,
      input.roomId ?? null,
      window.starts.toISOString(),
      window.ends.toISOString(),
      window.duration,
      Boolean(input.allDay),
      window.status,
      window.price,
      input.notes ?? null,
      Boolean(input.bookedOnline),
      recurrenceId,
      manageToken ? hashToken(manageToken) : null,
      actorId,
    ]
  );
  return inserted.rows[0].id as string;
}

function shiftStart(start: Date, timeZone: string, freq: "DAILY" | "WEEKLY" | "MONTHLY", steps: number, interval: number) {
  const date = formatDate(start, timeZone);
  const time = formatHm(start, timeZone);
  const nextDate =
    freq === "MONTHLY"
      ? addMonthsToDateKey(date, steps * interval)
      : addDaysToDateKey(date, steps * interval * (freq === "DAILY" ? 1 : 7));
  return zonedTimeToUtc(nextDate, time, timeZone);
}

export async function createAppointment(input: AppointmentInput, actor: StaffSession | null, meta?: { ip?: string | null; userAgent?: string | null }) {
  const location = await query<{ timezone: string }>(`SELECT timezone FROM locations WHERE id = $1`, [input.locationId]);
  if (!location.rows[0]) throw new DomainError("Sede no encontrada.");
  const tz = location.rows[0].timezone || "America/Chicago";
  const base = await resolveWindow({
    ...input,
    startsAt: parseClinicDateTime(input.startsAt, tz).toISOString(),
    endsAt: input.endsAt ? parseClinicDateTime(input.endsAt, tz).toISOString() : null,
  });
  const rule = input.recurrence;
  const count = rule ? Math.min(Math.max(rule.count || 8, 1), 52) : 1;
  const interval = rule?.interval || 1;
  const until = rule?.until ? new Date(rule.until).getTime() : Infinity;
  const manageToken = randomBytes(24).toString("base64url");

  const actorId = actor && actor.staff.email !== "api" ? actor.staff.id : null;
  const ids = await withTx(async (q) => {
    let recurrenceId: string | null = null;
    if (rule) {
      const rec = await q<{ id: string }>(
        `INSERT INTO appointment_recurrences (rrule, until_date, occurrence_count)
         VALUES ($1, $2, $3) RETURNING id`,
        [`FREQ=${rule.freq};INTERVAL=${interval}`, rule.until ?? null, count]
      );
      recurrenceId = rec.rows[0].id;
    }
    const created: string[] = [];
    for (let i = 0; i < count; i++) {
      const starts = i === 0 || !rule ? base.starts : shiftStart(base.starts, tz, rule.freq, i, interval);
      if (starts.getTime() > until) break;
      const ends = new Date(starts.getTime() + base.duration * 60000);
      const id = await insertOne(
        q,
        input,
        { ...base, starts, ends },
        actorId,
        recurrenceId,
        i === 0 ? manageToken : null
      );
      created.push(id);
    }
    return created;
  });

  for (const id of ids) {
    const token = id === ids[0] ? manageToken : null;
    await enqueueForAppointment(id, "cita_creada", token);
    const rules = await query<{ trigger_key: string }>(
      `SELECT DISTINCT trigger_key FROM message_rules WHERE is_active AND trigger_key = 'recordatorio'`
    );
    if (rules.rows.length) await enqueueForAppointment(id, "recordatorio", token);
    await emitWebhook("appointment.created", { appointmentId: id });
    await writeAudit({
      actorType: actor ? "staff" : "system",
      actorId: actor && actor.staff.email !== "api" ? actor.staff.id : null,
      action: "appointment.create",
      entityType: "appointment",
      entityId: id,
      patientId: input.patientId ?? null,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
  }

  const row = await query(`${SELECT} WHERE a.id = $1`, [ids[0]]);
  return { appointment: mapAppointment(row.rows[0], manageToken), ids };
}

export async function listAppointments(from: string, to: string, filters: { staffUserId?: string; locationId?: string; roomId?: string; patientId?: string }) {
  const res = await query(
    `${SELECT}
     WHERE a.starts_at < $2 AND a.ends_at > $1
       AND ($3::uuid IS NULL OR a.staff_user_id = $3)
       AND ($4::uuid IS NULL OR a.location_id = $4)
       AND ($5::uuid IS NULL OR a.room_id = $5)
       AND ($6::uuid IS NULL OR a.patient_id = $6)
     ORDER BY a.starts_at`,
    [from, to, filters.staffUserId ?? null, filters.locationId ?? null, filters.roomId ?? null, filters.patientId ?? null]
  );
  return res.rows.map((row) => mapAppointment(row));
}

export async function updateAppointment(
  id: string,
  patch: Partial<AppointmentInput> & { cancelReason?: string | null },
  actor: StaffSession | null,
  meta?: { ip?: string | null; userAgent?: string | null }
) {
  const current = await query(`${SELECT} WHERE a.id = $1`, [id]);
  if (!current.rows[0]) throw new DomainError("Cita no encontrada.", 404);
  const row = current.rows[0] as Record<string, unknown>;
  const next: AppointmentInput = {
    patientId: patch.patientId === undefined ? (row.patient_id as string | null) : patch.patientId,
    serviceId: patch.serviceId === undefined ? (row.service_id as string | null) : patch.serviceId,
    staffUserId: patch.staffUserId || (row.staff_user_id as string),
    locationId: patch.locationId || (row.location_id as string),
    roomId: patch.roomId === undefined ? (row.room_id as string | null) : patch.roomId,
    startsAt: patch.startsAt || new Date(row.starts_at as string).toISOString(),
    endsAt: patch.endsAt || (patch.startsAt ? null : new Date(row.ends_at as string).toISOString()),
    durationMinutes: patch.durationMinutes ?? (row.duration_minutes as number),
    allDay: patch.allDay ?? Boolean(row.all_day),
    status: patch.status || (row.status as string),
    price: patch.price === undefined ? (row.price == null ? null : Number(row.price)) : patch.price,
    notes: patch.notes === undefined ? (row.notes as string | null) : patch.notes,
    bookedOnline: Boolean(row.booked_online),
  };
  const location = await query<{ timezone: string }>(`SELECT timezone FROM locations WHERE id = $1`, [next.locationId]);
  const tz = location.rows[0]?.timezone || "America/Chicago";
  if (patch.startsAt) next.startsAt = parseClinicDateTime(patch.startsAt, tz).toISOString();
  if (patch.endsAt) next.endsAt = parseClinicDateTime(patch.endsAt, tz).toISOString();
  const window = await resolveWindow(next);
  await query(
    `UPDATE appointments SET
       patient_id=$2, service_id=$3, staff_user_id=$4, location_id=$5, room_id=$6,
       starts_at=$7, ends_at=$8, duration_minutes=$9, all_day=$10, status=$11, price=$12, notes=$13,
       cancelled_at = CASE WHEN $11 = 'cancelled' THEN coalesce(cancelled_at, now()) ELSE NULL END,
       cancel_reason = $14
     WHERE id = $1`,
    [
      id,
      next.patientId ?? null,
      next.serviceId ?? null,
      next.staffUserId,
      next.locationId,
      next.roomId ?? null,
      window.starts.toISOString(),
      window.ends.toISOString(),
      window.duration,
      Boolean(next.allDay),
      window.status,
      window.price,
      next.notes ?? null,
      patch.cancelReason ?? (row.cancel_reason as string | null),
    ]
  );
  if (window.status === "cancelled") {
    await query(
      `UPDATE messages SET status = 'skipped'
       WHERE appointment_id = $1 AND status = 'queued' AND scheduled_for > now()`,
      [id]
    );
    await enqueueForAppointment(id, "cancelacion");
    await emitWebhook("appointment.cancelled", { appointmentId: id });
  } else {
    await emitWebhook("appointment.updated", { appointmentId: id });
  }
  await writeAudit({
    actorType: actor ? "staff" : "patient",
    actorId: actor?.staff.id ?? (next.patientId ?? null),
    action: "appointment.update",
    entityType: "appointment",
    entityId: id,
    patientId: next.patientId ?? null,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
    metadata: { status: window.status },
  });
  const updated = await query(`${SELECT} WHERE a.id = $1`, [id]);
  return mapAppointment(updated.rows[0]);
}

export async function findByManageToken(token: string) {
  const res = await query(`${SELECT} WHERE a.manage_token_hash = $1`, [hashToken(token)]);
  return res.rows[0] ? mapAppointment(res.rows[0], token) : null;
}
