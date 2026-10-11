import { query as poolQuery } from "@/lib/db";
import type { TxQuery } from "@/lib/dbTx";
import { DomainError } from "@/lib/http";
import { formatDate } from "@/lib/scheduling/time";

type Run = TxQuery;

function db(q?: TxQuery): Run {
  return q ?? ((text, params) => poolQuery(text, params));
}

type Policy = {
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_days_between: number;
  max_per_patient: number | null;
  max_per_day: number | null;
};

function dayDistance(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

async function policy(run: Run, serviceId: string) {
  const res = await run<Policy>(
    `SELECT buffer_before_minutes, buffer_after_minutes, min_days_between, max_per_patient, max_per_day
     FROM services WHERE id = $1`,
    [serviceId]
  );
  return res.rows[0] ?? null;
}

/** Día cerrado por cupo, frecuencia o tope del paciente. No mira el horario concreto. */
export async function serviceDayBlock(
  input: {
    serviceId: string;
    locationId: string;
    date: string;
    timezone: string;
    patientId?: string | null;
    ignoreAppointmentId?: string | null;
  },
  q?: TxQuery
): Promise<string | null> {
  const run = db(q);
  const rules = await policy(run, input.serviceId);
  if (!rules) return null;

  if (input.patientId && rules.max_per_patient != null) {
    const count = await run<{ n: number }>(
      `SELECT count(*)::int AS n FROM appointments
       WHERE service_id = $1 AND patient_id = $2
         AND status NOT IN ('cancelled', 'no_show')
         AND ($3::uuid IS NULL OR id <> $3)`,
      [input.serviceId, input.patientId, input.ignoreAppointmentId ?? null]
    );
    if (count.rows[0].n >= rules.max_per_patient) {
      return rules.max_per_patient === 1
        ? "Este servicio solo se agenda una vez por paciente."
        : `Este servicio permite ${rules.max_per_patient} citas por paciente.`;
    }
  }

  if (input.patientId && rules.min_days_between > 0) {
    const prior = await run<{ day: string }>(
      `SELECT to_char((a.starts_at AT TIME ZONE $4)::date, 'YYYY-MM-DD') AS day
       FROM appointments a
       WHERE a.service_id = $1 AND a.patient_id = $2
         AND a.status NOT IN ('cancelled', 'no_show')
         AND ($3::uuid IS NULL OR a.id <> $3)`,
      [input.serviceId, input.patientId, input.ignoreAppointmentId ?? null, input.timezone]
    );
    const tooClose = prior.rows.some((row) => Math.abs(dayDistance(input.date, row.day)) < rules.min_days_between);
    if (tooClose) {
      return `Hay que dejar ${rules.min_days_between} días entre citas de este servicio.`;
    }
  }

  if (rules.max_per_day != null) {
    const count = await run<{ n: number }>(
      `SELECT count(*)::int AS n FROM appointments
       WHERE service_id = $1 AND location_id = $2
         AND status NOT IN ('cancelled', 'no_show')
         AND (starts_at AT TIME ZONE $4)::date = $5::date
         AND ($3::uuid IS NULL OR id <> $3)`,
      [input.serviceId, input.locationId, input.ignoreAppointmentId ?? null, input.timezone, input.date]
    );
    if (count.rows[0].n >= rules.max_per_day) {
      return "Ese día ya tiene la cita de paciente nuevo. Solo se agenda una por día.";
    }
  }

  return null;
}

export async function assertBookable(
  input: {
    serviceId?: string | null;
    patientId?: string | null;
    locationId: string;
    staffUserId: string;
    roomId?: string | null;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    ignoreAppointmentId?: string | null;
  },
  q?: TxQuery
) {
  if (!input.serviceId || input.endsAt <= input.startsAt) return;
  const run = db(q);
  const rules = await policy(run, input.serviceId);
  if (!rules) return;
  const date = formatDate(input.startsAt, input.timezone);
  const reason = await serviceDayBlock(
    {
      serviceId: input.serviceId,
      locationId: input.locationId,
      date,
      timezone: input.timezone,
      patientId: input.patientId,
      ignoreAppointmentId: input.ignoreAppointmentId,
    },
    q
  );
  if (reason) throw new DomainError(reason);

  const windowStart = new Date(input.startsAt.getTime() - rules.buffer_before_minutes * 60000);
  const windowEnd = new Date(input.endsAt.getTime() + rules.buffer_after_minutes * 60000);
  const clash = await run<{ id: string }>(
    `SELECT a.id
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.status NOT IN ('cancelled', 'no_show')
       AND ($1::uuid IS NULL OR a.id <> $1)
       AND (
         a.staff_user_id = $2
         OR ($3::uuid IS NOT NULL AND a.room_id = $3)
       )
       AND (a.starts_at - make_interval(mins => COALESCE(s.buffer_before_minutes, 0))) < $5
       AND (a.ends_at + make_interval(mins => COALESCE(s.buffer_after_minutes, 0))) > $4
     LIMIT 1`,
    [
      input.ignoreAppointmentId ?? null,
      input.staffUserId,
      input.roomId ?? null,
      windowStart.toISOString(),
      windowEnd.toISOString(),
    ]
  );
  if (clash.rows[0]) {
    throw new DomainError("Ese horario cae en la cita o en la hora de descanso de otra cita.");
  }
}
