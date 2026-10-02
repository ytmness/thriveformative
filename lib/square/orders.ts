import { squareFetch } from "@/lib/square/client";
import { readSquareMoney } from "@/lib/square/money";

type CreateOrderResponse = {
  order?: {
    id?: string;
    total_money?: { amount?: number | string; currency?: string };
  };
};

export async function createSquareOrder(input: {
  idempotencyKey: string;
  locationId: string;
  lines: { name: string; quantity: number; amount: number; currency: string }[];
}): Promise<{ id: string; totalAmount: number; currency: string }> {
  const body = await squareFetch<CreateOrderResponse>("/v2/orders", {
    method: "POST",
    body: {
      idempotency_key: input.idempotencyKey,
      order: {
        location_id: input.locationId,
        line_items: input.lines.map((line) => ({
          name: line.name.slice(0, 255),
          quantity: String(line.quantity),
          base_price_money: {
            amount: line.amount,
            currency: line.currency,
          },
        })),
      },
    },
  });

  const total = readSquareMoney(body.order?.total_money);
  if (!body.order?.id || !total) {
    throw new Error("Square no devolvió el pedido.");
  }

  return { id: body.order.id, totalAmount: total.amount, currency: total.currency };
}
