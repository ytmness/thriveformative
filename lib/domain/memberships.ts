import { query as poolQuery } from "@/lib/db";
import type { TxQuery } from "@/lib/dbTx";
import { DomainError } from "@/lib/http";

type Run = TxQuery;

function db(q?: TxQuery): Run {
  return q ?? ((text, params) => poolQuery(text, params));
}

export function intervalUnitOf(value: unknown): "month" | "year" | "day90" {
  if (value === "year") return "year";
  if (value === "day90") return "day90";
  return "month";
}

export function periodEndFrom(start: Date, unit: "month" | "year" | "day90") {
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  if (unit === "year") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else if (unit === "day90") end.setUTCDate(end.getUTCDate() + 90);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(end.getUTCDate() - 1);
  return end;
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function grantMembershipPeriod(
  input: {
    patientMembershipId: string;
    membershipId: string;
    periodStart?: Date;
  },
  q?: TxQuery
) {
  const run = db(q);
  const plan = await run<{ interval_unit: string }>(
    `SELECT interval_unit FROM memberships WHERE id = $1`,
    [input.membershipId]
  );
  if (!plan.rows[0]) throw new DomainError("Membresía no encontrada.");
  const unit = intervalUnitOf(plan.rows[0].interval_unit);
  const start = input.periodStart ?? new Date();
  const startDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDay = periodEndFrom(startDay, unit);
  const items = await run<{ service_id: string; quantity: number }>(
    `SELECT service_id, quantity FROM membership_items WHERE membership_id = $1`,
    [input.membershipId]
  );
  await run(
    `UPDATE patient_memberships
     SET status = 'active',
         current_period_start = $2::date,
         current_period_end = $3::date
     WHERE id = $1`,
    [input.patientMembershipId, isoDate(startDay), isoDate(endDay)]
  );
  for (const item of items.rows) {
    await run(
      `INSERT INTO patient_membership_credits
         (patient_membership_id, service_id, allotted, remaining, period_start, period_end)
       VALUES ($1,$2,$3,$3,$4::date,$5::date)
       ON CONFLICT (patient_membership_id, service_id, period_start)
       DO UPDATE SET allotted = EXCLUDED.allotted, remaining = EXCLUDED.remaining, period_end = EXCLUDED.period_end`,
      [input.patientMembershipId, item.service_id, item.quantity, isoDate(startDay), isoDate(endDay)]
    );
  }
  return { periodStart: isoDate(startDay), periodEnd: isoDate(endDay) };
}

export async function activatePatientMembership(
  input: {
    patientId: string;
    membershipId: string;
    saleId?: string | null;
    renewalMode?: "square" | "manual";
    squareSubscriptionId?: string | null;
    squareCustomerId?: string | null;
  },
  q?: TxQuery
) {
  const run = db(q);
  const inserted = await run<{ id: string }>(
    `INSERT INTO patient_memberships
       (patient_id, membership_id, status, renewal_mode, square_subscription_id, square_customer_id, sale_id)
     VALUES ($1,$2,'active',$3,$4,$5,$6)
     RETURNING id`,
    [
      input.patientId,
      input.membershipId,
      input.renewalMode || "manual",
      input.squareSubscriptionId || null,
      input.squareCustomerId || null,
      input.saleId || null,
    ]
  );
  const id = inserted.rows[0].id;
  await grantMembershipPeriod({ patientMembershipId: id, membershipId: input.membershipId }, q);
  return id;
}

export async function hasActiveMembership(patientId: string, q?: TxQuery) {
  const run = db(q);
  const row = await run<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM patient_memberships
       WHERE patient_id = $1
         AND status = 'active'
         AND (current_period_start IS NULL OR current_period_start <= current_date)
         AND (current_period_end IS NULL OR current_period_end >= current_date)
     ) AS ok`,
    [patientId]
  );
  return Boolean(row.rows[0]?.ok);
}

export async function assertActiveMembership(patientId: string, q?: TxQuery) {
  if (await hasActiveMembership(patientId, q)) return;
  throw new DomainError("Necesitas una membresía activa para agendar.", 403);
}

export async function creditForService(
  input: { patientId: string; serviceId: string },
  q?: TxQuery
) {
  const run = db(q);
  const row = await run<{
    credit_id: string;
    remaining: number;
    membership_name: string;
  }>(
    `SELECT c.id AS credit_id, c.remaining, m.name AS membership_name
     FROM patient_membership_credits c
     JOIN patient_memberships pm ON pm.id = c.patient_membership_id
     JOIN memberships m ON m.id = pm.membership_id
     WHERE pm.patient_id = $1
       AND pm.status = 'active'
       AND c.service_id = $2
       AND c.remaining > 0
       AND c.period_start <= current_date
       AND c.period_end >= current_date
     ORDER BY c.period_end ASC
     LIMIT 1`,
    [input.patientId, input.serviceId]
  );
  return row.rows[0] ?? null;
}

export async function serviceRequiresMembership(serviceId: string, q?: TxQuery) {
  const run = db(q);
  const row = await run<{ requires_membership: boolean; in_plan: boolean }>(
    `SELECT s.requires_membership,
            EXISTS (SELECT 1 FROM membership_items mi WHERE mi.service_id = s.id) AS in_plan
     FROM services s WHERE s.id = $1`,
    [serviceId]
  );
  const svc = row.rows[0];
  return Boolean(svc?.requires_membership || svc?.in_plan);
}

export async function assertMembershipCredit(
  input: { patientId?: string | null; serviceId: string },
  q?: TxQuery
) {
  if (!(await serviceRequiresMembership(input.serviceId, q))) return null;
  if (!input.patientId) {
    throw new DomainError("Este servicio requiere una membresía activa.");
  }
  const credit = await creditForService({ patientId: input.patientId, serviceId: input.serviceId }, q);
  if (!credit) {
    throw new DomainError("No te quedan cupos de este servicio en tu membresía.");
  }
  return credit;
}

export async function consumeMembershipCredit(
  input: { patientId: string; serviceId: string; appointmentId?: string | null },
  q?: TxQuery
) {
  const run = db(q);
  const credit = await assertMembershipCredit(input, q);
  if (!credit) return null;
  const updated = await run<{ id: string }>(
    `UPDATE patient_membership_credits
     SET remaining = remaining - 1
     WHERE id = $1 AND remaining > 0
     RETURNING id`,
    [credit.credit_id]
  );
  if (!updated.rows[0]) throw new DomainError("No te quedan cupos de este servicio en tu membresía.");
  return updated.rows[0].id;
}

export async function restoreMembershipCredit(
  input: { patientId: string; serviceId: string },
  q?: TxQuery
) {
  const run = db(q);
  await run(
    `UPDATE patient_membership_credits c
     SET remaining = LEAST(c.allotted, c.remaining + 1)
     FROM patient_memberships pm
     WHERE c.patient_membership_id = pm.id
       AND pm.patient_id = $1
       AND pm.status = 'active'
       AND c.service_id = $2
       AND c.period_start <= current_date
       AND c.period_end >= current_date
       AND c.remaining < c.allotted`,
    [input.patientId, input.serviceId]
  );
}

export async function renewMembershipBySquareSubscription(squareSubscriptionId: string, q?: TxQuery) {
  const run = db(q);
  const row = await run<{ id: string; membership_id: string }>(
    `SELECT id, membership_id FROM patient_memberships
     WHERE square_subscription_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [squareSubscriptionId]
  );
  if (!row.rows[0]) return null;
  await grantMembershipPeriod(
    { patientMembershipId: row.rows[0].id, membershipId: row.rows[0].membership_id },
    q
  );
  await run(
    `UPDATE patient_memberships SET status = 'active', renewal_mode = 'square' WHERE id = $1`,
    [row.rows[0].id]
  );
  return row.rows[0].id;
}

export async function setMembershipStatusBySquare(
  squareSubscriptionId: string,
  status: "active" | "paused" | "cancelled",
  q?: TxQuery
) {
  const run = db(q);
  await run(
    `UPDATE patient_memberships SET status = $2 WHERE square_subscription_id = $1`,
    [squareSubscriptionId, status]
  );
}

export type ActiveMembershipCredit = {
  serviceId: string;
  serviceName: string;
  remaining: number;
  allotted: number;
  membershipName: string;
  periodStart: string;
  periodEnd: string;
};

export async function listActiveCredits(patientId: string, q?: TxQuery): Promise<ActiveMembershipCredit[]> {
  const run = db(q);
  const rows = await run<{
    service_id: string;
    service_name: string;
    remaining: number;
    allotted: number;
    membership_name: string;
    period_start: string;
    period_end: string;
  }>(
    `SELECT c.service_id, s.name AS service_name,
            c.remaining, c.allotted, m.name AS membership_name,
            c.period_start::text, c.period_end::text
     FROM patient_membership_credits c
     JOIN patient_memberships pm ON pm.id = c.patient_membership_id
     JOIN memberships m ON m.id = pm.membership_id
     JOIN services s ON s.id = c.service_id
     WHERE pm.patient_id = $1
       AND pm.status = 'active'
       AND (pm.current_period_start IS NULL OR pm.current_period_start <= current_date)
       AND (pm.current_period_end IS NULL OR pm.current_period_end >= current_date)
       AND c.period_start <= current_date
       AND c.period_end >= current_date
     ORDER BY m.name, s.name`,
    [patientId]
  );
  return rows.rows.map((row) => ({
    serviceId: row.service_id,
    serviceName: row.service_name,
    remaining: Number(row.remaining || 0),
    allotted: Number(row.allotted || 0),
    membershipName: row.membership_name,
    periodStart: String(row.period_start || "").slice(0, 10),
    periodEnd: String(row.period_end || "").slice(0, 10),
  }));
}

export function creditTotalsByService(credits: ActiveMembershipCredit[]) {
  const totals = new Map<string, { remaining: number; allotted: number }>();
  for (const credit of credits) {
    const prev = totals.get(credit.serviceId) ?? { remaining: 0, allotted: 0 };
    totals.set(credit.serviceId, {
      remaining: prev.remaining + credit.remaining,
      allotted: prev.allotted + credit.allotted,
    });
  }
  return totals;
}

export async function listPatientMembershipDetails(patientId: string) {
  const plans = await poolQuery<{
    id: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    renewal_mode: string;
    name: string;
    price: string;
    interval_unit: string;
  }>(
    `SELECT pm.id, pm.status, pm.current_period_start, pm.current_period_end, pm.renewal_mode,
            m.name, m.price, m.interval_unit
     FROM patient_memberships pm
     JOIN memberships m ON m.id = pm.membership_id
     WHERE pm.patient_id = $1
     ORDER BY pm.created_at DESC`,
    [patientId]
  );
  const credits = await poolQuery<{
    patient_membership_id: string;
    service_id: string;
    service_name: string;
    allotted: number;
    remaining: number;
    period_start: string;
    period_end: string;
  }>(
    `SELECT c.patient_membership_id, c.service_id, s.name AS service_name,
            c.allotted, c.remaining, c.period_start, c.period_end
     FROM patient_membership_credits c
     JOIN services s ON s.id = c.service_id
     JOIN patient_memberships pm ON pm.id = c.patient_membership_id
     WHERE pm.patient_id = $1
       AND c.period_start <= current_date
       AND c.period_end >= current_date
     ORDER BY s.name`,
    [patientId]
  );
  return plans.rows.map((plan) => ({
    ...plan,
    price: Number(plan.price),
    credits: credits.rows.filter((row) => row.patient_membership_id === plan.id),
  }));
}
