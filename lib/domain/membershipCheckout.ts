import { currentPatient } from "@/lib/auth/patientAccess";
import { DomainError } from "@/lib/http";
import { query } from "@/lib/db";
import { log } from "@/lib/log";
import {
  activatePatientMembership,
  hasActivePlan,
  intervalUnitOf,
  listActiveCredits,
} from "@/lib/domain/memberships";
import { createCounterOrder } from "@/lib/square/orders";
import { createSquarePayment } from "@/lib/square/payments";
import { getSquareLocation } from "@/lib/square/client";
import { majorToMinor } from "@/lib/square/money";
import {
  ensureSquareCustomer,
  tryCreateSquareCard,
  tryCreateSquareSubscription,
} from "@/lib/square/subscriptions";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { given: parts[0] || null, family: parts.slice(1).join(" ") || null };
}

export async function subscribePublic(input: {
  membershipId: string;
  sourceId: string;
  idempotencyKey: string;
}) {
  const patient = await currentPatient().catch(() => null);
  if (!patient) throw new DomainError("Regístrate para suscribirte.", 401);
  if (!input.sourceId.trim()) throw new DomainError("Falta la tarjeta.");
  if (!/^[0-9a-f-]{36}$/i.test(input.idempotencyKey)) throw new DomainError("Solicitud inválida.");

  const plan = await query<{
    id: string;
    name: string;
    price: string;
    interval_unit: string;
    is_active: boolean;
  }>(
    `SELECT id, name, price::text, interval_unit, is_active FROM memberships WHERE id = $1`,
    [input.membershipId]
  );
  const membership = plan.rows[0];
  if (!membership?.is_active) throw new DomainError("Ese plan no está a la venta.");
  if (await hasActivePlan(patient.id, membership.id)) {
    return { alreadyActive: true, credits: await listActiveCredits(patient.id) };
  }

  const location = await getSquareLocation();
  const amount = majorToMinor(Number(membership.price || 0), location.currency);
  if (amount <= 0) throw new DomainError("Este plan no tiene un precio para cobrar en línea.");

  const names = splitName(patient.name);
  const customerId = await ensureSquareCustomer({
    email: patient.email,
    givenName: names.given,
    familyName: names.family,
    referenceId: patient.id,
  });
  const cardId = await tryCreateSquareCard({ customerId, sourceId: input.sourceId });
  const order = await createCounterOrder({
    idempotencyKey: `${input.idempotencyKey}-order`,
    locationId: location.id,
    referenceId: `mem:${membership.id.slice(0, 8)}`,
    lines: [
      {
        name: membership.name,
        quantity: "1",
        amount,
        currency: location.currency,
      },
    ],
  });
  const payment = await createSquarePayment({
    sourceId: cardId || input.sourceId,
    idempotencyKey: `${input.idempotencyKey}-pay`,
    amount: order.totalAmount,
    currency: order.currency,
    locationId: location.id,
    orderId: order.id,
    note: membership.name,
    referenceId: patient.id,
  });
  if (payment.status !== "COMPLETED" && payment.status !== "APPROVED") {
    throw new DomainError("El pago no se completó. Revisa la tarjeta.");
  }

  if (await hasActivePlan(patient.id, membership.id)) {
    return { alreadyActive: true, credits: await listActiveCredits(patient.id) };
  }

  const unit = intervalUnitOf(membership.interval_unit);
  const recurring = unit === "month" || unit === "year";
  const sub = recurring
    ? await tryCreateSquareSubscription({
        membershipId: membership.id,
        customerId,
        cardId,
      })
    : { subscriptionId: null as string | null, renewalMode: "manual" as const };

  try {
    await activatePatientMembership({
      patientId: patient.id,
      membershipId: membership.id,
      renewalMode: sub.renewalMode,
      squareSubscriptionId: sub.subscriptionId,
      squareCustomerId: customerId,
    });
  } catch (error) {
    log.error("memberships", "pago de membresía sin activar el plan", {
      detail: error instanceof Error ? error.message : "error",
    });
    throw new DomainError("El pago pasó, pero el plan no se activó. Escribe a la clínica con tu correo.");
  }

  return { alreadyActive: false, credits: await listActiveCredits(patient.id) };
}
