import { squareFetch } from "@/lib/square/client";
import { readSquareMoney } from "@/lib/square/money";

type CreateOrderResponse = {
  order?: {
    id?: string;
    total_money?: { amount?: number | string; currency?: string };
  };
};

export type StoreFulfillment =
  | { method: "pickup"; name: string; locationName: string }
  | {
      method: "shipping";
      name: string;
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: "MX" | "US";
    };

export function fulfillmentNote(input: StoreFulfillment): string {
  if (input.method === "pickup") return `Recolección · ${input.locationName} · ${input.name}`;
  return `Envío · ${input.name}, ${input.line1}, ${input.city}, ${input.state} ${input.postalCode}, ${input.country}`;
}

function squareFulfillment(input: StoreFulfillment) {
  if (input.method === "pickup") {
    return {
      type: "PICKUP",
      state: "PROPOSED",
      pickup_details: {
        recipient: { display_name: input.name.slice(0, 255) },
        schedule_type: "ASAP",
      },
    };
  }
  return {
    type: "SHIPMENT",
    state: "PROPOSED",
    shipment_details: {
      recipient: {
        display_name: input.name.slice(0, 255),
        address: {
          address_line_1: input.line1.slice(0, 255),
          locality: input.city.slice(0, 255),
          administrative_district_level_1: input.state.slice(0, 255),
          postal_code: input.postalCode.slice(0, 12),
          country: input.country,
        },
      },
    },
  };
}

export async function createSquareOrder(input: {
  idempotencyKey: string;
  locationId: string;
  lines: { name: string; quantity: number; amount: number; currency: string }[];
  fulfillment: StoreFulfillment;
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
        fulfillments: [squareFulfillment(input.fulfillment)],
      },
    },
  });

  const total = readSquareMoney(body.order?.total_money);
  if (!body.order?.id || !total) {
    throw new Error("Square no devolvió el pedido.");
  }

  return { id: body.order.id, totalAmount: total.amount, currency: total.currency };
}

export async function createCounterOrder(input: {
  idempotencyKey: string;
  locationId: string;
  lines: { name: string; quantity: string; amount: number; currency: string }[];
  referenceId: string;
}): Promise<{ id: string; totalAmount: number; currency: string }> {
  const body = await squareFetch<CreateOrderResponse>("/v2/orders", {
    method: "POST",
    body: {
      idempotency_key: input.idempotencyKey,
      order: {
        location_id: input.locationId,
        reference_id: input.referenceId.slice(0, 40),
        line_items: input.lines.map((line) => ({
          name: line.name.slice(0, 255),
          quantity: line.quantity,
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
