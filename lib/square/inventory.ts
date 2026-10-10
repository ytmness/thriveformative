import { randomUUID } from "crypto";
import { squareFetch, getSquareLocation } from "@/lib/square/client";

export async function sellSquareVariation(variationId: string, quantity: number, idempotencyKey: string) {
  if (!variationId || variationId === "default" || quantity <= 0) return;
  const location = await getSquareLocation();
  await squareFetch("/v2/inventory/changes/batch-create", {
    method: "POST",
    body: {
      idempotency_key: idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 45) || randomUUID(),
      changes: [
        {
          type: "ADJUSTMENT",
          adjustment: {
            catalog_object_id: variationId,
            location_id: location.id,
            quantity: String(quantity),
            from_state: "IN_STOCK",
            to_state: "SOLD",
            occurred_at: new Date().toISOString(),
          },
        },
      ],
    },
  });
}

export async function squareVariationHasCount(variationId: string): Promise<boolean> {
  const location = await getSquareLocation();
  const body = await squareFetch<{ counts?: { quantity?: string }[] }>(
    `/v2/inventory/${encodeURIComponent(variationId)}?location_ids=${encodeURIComponent(location.id)}`
  );
  return (body.counts ?? []).some((row) => row.quantity != null);
}

export async function setSquareVariationCount(variationId: string, quantity: number) {
  const location = await getSquareLocation();
  await squareFetch("/v2/inventory/changes/batch-create", {
    method: "POST",
    body: {
      idempotency_key: randomUUID(),
      changes: [
        {
          type: "PHYSICAL_COUNT",
          physical_count: {
            catalog_object_id: variationId,
            location_id: location.id,
            quantity: String(Math.max(0, quantity)),
            state: "IN_STOCK",
            occurred_at: new Date().toISOString(),
          },
        },
      ],
    },
  });
}
