import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { log } from "@/lib/log";
import { SquareApiError, getSquareLocation, squareFetch } from "@/lib/square/client";
import { majorToMinor } from "@/lib/square/money";
import { intervalUnitOf } from "@/lib/domain/memberships";

function cadenceOf(unit: "month" | "year" | "day90") {
  if (unit === "year") return "ANNUAL";
  if (unit === "day90") return "NINETY_DAYS";
  return "MONTHLY";
}

type CatalogObject = {
  type?: string;
  id?: string;
  version?: number;
  subscription_plan_data?: { name?: string };
  subscription_plan_variation_data?: {
    name?: string;
    subscription_plan_id?: string;
    phases?: unknown[];
  };
};

export async function syncMembershipSquarePlan(membershipId: string) {
  const row = await query<{
    id: string;
    name: string;
    price: string;
    interval_unit: string;
    square_plan_id: string | null;
    square_plan_variation_id: string | null;
  }>(
    `SELECT id, name, price, interval_unit, square_plan_id, square_plan_variation_id
     FROM memberships WHERE id = $1`,
    [membershipId]
  );
  const plan = row.rows[0];
  if (!plan) throw new DomainError("Membresía no encontrada.");

  try {
    const location = await getSquareLocation();
    const unit = intervalUnitOf(plan.interval_unit);
    const amount = majorToMinor(Number(plan.price || 0), location.currency);
    if (amount <= 0) {
      return { planId: plan.square_plan_id, variationId: plan.square_plan_variation_id };
    }

    const planTempId = plan.square_plan_id || `#membership-plan-${plan.id}`;
    const variationTempId = plan.square_plan_variation_id || `#membership-var-${plan.id}`;
    const objects: CatalogObject[] = [
      {
        type: "SUBSCRIPTION_PLAN",
        id: planTempId,
        subscription_plan_data: { name: plan.name },
      },
      {
        type: "SUBSCRIPTION_PLAN_VARIATION",
        id: variationTempId,
        subscription_plan_variation_data: {
          name: `${plan.name} · ${unit}`,
          subscription_plan_id: planTempId,
          phases: [
            {
              cadence: cadenceOf(unit),
              periods: null,
              recurring_price_money: {
                amount,
                currency: location.currency,
              },
            },
          ],
        },
      },
    ];

    if (plan.square_plan_id) {
      try {
        const existing = await squareFetch<{ object?: CatalogObject }>(
          `/v2/catalog/object/${encodeURIComponent(plan.square_plan_id)}`
        );
        if (existing.object?.version) objects[0].version = existing.object.version;
      } catch {
        /* create fresh */
      }
    }
    if (plan.square_plan_variation_id) {
      try {
        const existing = await squareFetch<{ object?: CatalogObject }>(
          `/v2/catalog/object/${encodeURIComponent(plan.square_plan_variation_id)}`
        );
        if (existing.object?.version) objects[1].version = existing.object.version;
      } catch {
        /* create fresh */
      }
    }

    const upserted = await squareFetch<{
      id_mappings?: { client_object_id?: string; object_id?: string }[];
      objects?: CatalogObject[];
    }>("/v2/catalog/batch-upsert", {
      method: "POST",
      body: {
        idempotency_key: randomUUID(),
        batches: [{ objects }],
      },
    });

    const map = new Map(
      (upserted.id_mappings || []).map((item) => [String(item.client_object_id), String(item.object_id)])
    );
    const planId =
      map.get(planTempId) ||
      upserted.objects?.find((item) => item.type === "SUBSCRIPTION_PLAN")?.id ||
      plan.square_plan_id;
    const variationId =
      map.get(variationTempId) ||
      upserted.objects?.find((item) => item.type === "SUBSCRIPTION_PLAN_VARIATION")?.id ||
      plan.square_plan_variation_id;

    await query(
      `UPDATE memberships
       SET square_plan_id = COALESCE($2, square_plan_id),
           square_plan_variation_id = COALESCE($3, square_plan_variation_id)
       WHERE id = $1`,
      [membershipId, planId || null, variationId || null]
    );
    return { planId, variationId };
  } catch (error) {
    const message = error instanceof SquareApiError ? error.message : error instanceof Error ? error.message : "Square";
    log.warn("memberships", "no se pudo sincronizar el plan en Square", { name: message });
    return { planId: plan.square_plan_id, variationId: plan.square_plan_variation_id, error: message };
  }
}

export async function ensureSquareCustomer(input: {
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  referenceId?: string | null;
}) {
  const email = (input.email || "").trim().toLowerCase();
  if (!email) throw new DomainError("La suscripción Square necesita el correo del paciente.");
  const search = await squareFetch<{ customers?: { id?: string }[] }>("/v2/customers/search", {
    method: "POST",
    body: {
      query: {
        filter: {
          email_address: { exact: email },
        },
      },
      limit: 1,
    },
  });
  if (search.customers?.[0]?.id) return search.customers[0].id;
  const created = await squareFetch<{ customer?: { id?: string } }>("/v2/customers", {
    method: "POST",
    body: {
      idempotency_key: randomUUID(),
      email_address: email,
      given_name: input.givenName || undefined,
      family_name: input.familyName || undefined,
      reference_id: input.referenceId || undefined,
    },
  });
  if (!created.customer?.id) throw new DomainError("Square no devolvió el cliente.");
  return created.customer.id;
}

/** Crea la suscripción solo si hay tarjeta en archivo; si no, deja renovación manual. */
export async function tryCreateSquareSubscription(input: {
  membershipId: string;
  customerId: string;
  cardId?: string | null;
}) {
  const row = await query<{ square_plan_variation_id: string | null }>(
    `SELECT square_plan_variation_id FROM memberships WHERE id = $1`,
    [input.membershipId]
  );
  let variationId = row.rows[0]?.square_plan_variation_id || null;
  if (!variationId) {
    const synced = await syncMembershipSquarePlan(input.membershipId);
    variationId = synced.variationId || null;
  }
  if (!variationId || !input.cardId) {
    return { subscriptionId: null as string | null, renewalMode: "manual" as const };
  }
  const location = await getSquareLocation();
  const created = await squareFetch<{ subscription?: { id?: string } }>("/v2/subscriptions", {
    method: "POST",
    body: {
      idempotency_key: randomUUID(),
      location_id: location.id,
      plan_variation_id: variationId,
      customer_id: input.customerId,
      card_id: input.cardId,
    },
  });
  return {
    subscriptionId: created.subscription?.id || null,
    renewalMode: created.subscription?.id ? ("square" as const) : ("manual" as const),
  };
}
