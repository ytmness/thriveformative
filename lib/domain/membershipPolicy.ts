import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail } from "@/lib/emailServer";
import { getNotifyEmail, getSiteUrl } from "@/lib/env/server";
import { isPendingPeriodEnd } from "@/lib/domain/memberships";

export type MembershipAccess = "active" | "expiring" | "grace" | "expired" | "none" | "override";

export type MembershipPolicy = {
  graceDays: number;
  noticeDays: number;
};

export async function getMembershipPolicy(): Promise<MembershipPolicy> {
  const row = await query<{ value: { graceDays?: number; noticeDays?: number } | string }>(
    `SELECT value FROM clinic_settings WHERE key = 'membership_policy'`
  );
  const raw = row.rows[0]?.value;
  const value = typeof raw === "string" ? (JSON.parse(raw) as { graceDays?: number; noticeDays?: number }) : raw || {};
  return {
    graceDays: Math.max(0, Number(value.graceDays ?? 3)),
    noticeDays: Math.max(1, Number(value.noticeDays ?? 7)),
  };
}

export function daysBetween(endIso: string | null | undefined, from = new Date()) {
  if (!endIso) return null;
  const end = new Date(`${String(endIso).slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export function stateFromPeriod(input: {
  status: string;
  periodEnd: string | null;
  noticeDays: number;
  graceDays: number;
}) {
  if (input.status !== "active") return { state: "expired" as MembershipAccess, daysRemaining: daysBetween(input.periodEnd) };
  if (!input.periodEnd || isPendingPeriodEnd(input.periodEnd)) {
    return { state: "active" as MembershipAccess, daysRemaining: null as number | null };
  }
  const daysRemaining = daysBetween(input.periodEnd) ?? 0;
  if (daysRemaining >= 0 && daysRemaining <= input.noticeDays) return { state: "expiring" as MembershipAccess, daysRemaining };
  if (daysRemaining >= 0) return { state: "active" as MembershipAccess, daysRemaining };
  if (daysRemaining >= -input.graceDays) return { state: "grace" as MembershipAccess, daysRemaining };
  return { state: "expired" as MembershipAccess, daysRemaining };
}

export async function patientAccessState(patientId: string): Promise<MembershipAccess> {
  const policy = await getMembershipPolicy();
  const override = await query<{ membership_override: boolean }>(`SELECT membership_override FROM patients WHERE id = $1`, [patientId]);
  if (override.rows[0]?.membership_override) return "override";
  const rows = await query<{ status: string; current_period_end: string | null }>(
    `SELECT status, current_period_end::text AS current_period_end
     FROM patient_memberships
     WHERE patient_id = $1
     ORDER BY created_at DESC`,
    [patientId]
  );
  if (!rows.rows.length) return "none";
  const ranked = rows.rows.map((row) => stateFromPeriod({
    status: row.status,
    periodEnd: row.current_period_end,
    noticeDays: policy.noticeDays,
    graceDays: policy.graceDays,
  }));
  if (ranked.some((row) => row.state === "active" || row.state === "expiring" || row.state === "grace")) {
    return ranked.find((row) => row.state === "active" || row.state === "expiring" || row.state === "grace")!.state;
  }
  return "none";
}

export function hasBookingAccess(state: MembershipAccess) {
  return state === "active" || state === "expiring" || state === "grace" || state === "override";
}

export async function listExpiringMemberships() {
  const policy = await getMembershipPolicy();
  const rows = await query<{
    id: string;
    patient_id: string;
    first_name: string | null;
    last_name: string | null;
    name: string;
    current_period_end: string | null;
  }>(
    `SELECT pm.id, pm.patient_id, p.first_name, p.last_name, m.name, pm.current_period_end::text AS current_period_end
     FROM patient_memberships pm
     JOIN patients p ON p.id = pm.patient_id
     JOIN memberships m ON m.id = pm.membership_id
     WHERE pm.status = 'active'
       AND p.deleted_at IS NULL
       AND p.membership_override = false
       AND pm.current_period_end IS NOT NULL
       AND pm.current_period_end < DATE '2099-01-01'
       AND pm.current_period_end BETWEEN current_date AND current_date + $1::int
     ORDER BY pm.current_period_end ASC
     LIMIT 40`,
    [policy.noticeDays]
  );
  return rows.rows.map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    patientName: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
    name: row.name,
    currentPeriodEnd: row.current_period_end,
    daysRemaining: daysBetween(row.current_period_end),
  }));
}

export async function notifyExpiringMemberships() {
  const policy = await getMembershipPolicy();
  const due = await query<{
    id: string;
    patient_id: string;
    first_name: string | null;
    email_enc: Buffer | null;
    preferred_language: string | null;
    name: string;
    current_period_end: string;
  }>(
    `SELECT pm.id, pm.patient_id, p.first_name, p.email_enc, p.preferred_language, m.name,
            pm.current_period_end::text AS current_period_end
     FROM patient_memberships pm
     JOIN patients p ON p.id = pm.patient_id
     JOIN memberships m ON m.id = pm.membership_id
     WHERE pm.status = 'active'
       AND p.deleted_at IS NULL
       AND pm.current_period_end = current_date + $1::int
       AND (pm.last_expiry_notice_on IS NULL OR pm.last_expiry_notice_on < current_date)`,
    [policy.noticeDays]
  );
  const inbox = getNotifyEmail();
  const site = getSiteUrl();
  let sent = 0;
  for (const row of due.rows) {
    const english = row.preferred_language === "en";
    const who = row.first_name || "Paciente";
    const date = String(row.current_period_end).slice(0, 10);
    const link = `${site}/suscribir`;
    const email = decryptPhi(row.email_enc);
    if (email) {
      const subject = english ? "Your Thrive Formative plan ends soon" : "Tu plan de Thrive Formative vence pronto";
      const body = english
        ? `Hi ${who}, your membership ends on ${date}. Renew here: ${link}`
        : `Hola ${who}, tu membresía vence el ${date}. Renueva aquí: ${link}`;
      const result = await sendClinicEmail(email, subject, body, english ? "en" : "es");
      await query(
        `INSERT INTO messages (channel, recipient_enc, patient_id, subject, body, status, scheduled_for, sent_at, error, provider)
         VALUES ('email',$1,$2,$3,$4,$5, now(), CASE WHEN $5 = 'sent' THEN now() ELSE NULL END, $6, 'smtp')`,
        [encryptPhi(email), row.patient_id, subject, body, result.ok ? "sent" : "failed", result.ok ? null : result.error || "No se pudo enviar"]
      );
    }
    if (inbox) {
      await sendClinicEmail(
        inbox,
        "Membresías por vencer",
        `${who} · ${row.name} vence el ${date}.`
      ).catch(() => undefined);
    }
    await query(
      `INSERT INTO notifications (type, title, body, reference_id, patient_id)
       VALUES ('membership_expiring', $1, $2, $3, $4)`,
      [
        english ? "Membership ending soon" : "Membresía por vencer",
        english ? `Your plan ends on ${date}.` : `Tu plan vence el ${date}.`,
        row.id,
        row.patient_id,
      ]
    );
    await query(`UPDATE patient_memberships SET last_expiry_notice_on = current_date WHERE id = $1`, [row.id]);
    sent += 1;
  }
  if (due.rows.length && inbox) {
    await query(
      `INSERT INTO notifications (type, title, body)
       VALUES ('membership_expiring', 'Membresías por vencer', $1)`,
      [`${due.rows.length} membresía(s) vencen en ${policy.noticeDays} días.`]
    );
  }
  return { processed: due.rows.length, sent };
}
