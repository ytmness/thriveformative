import { squareFetch } from "@/lib/square/client";

export type SquarePaymentResult = {
  id: string;
  status: string;
  receiptUrl: string | null;
};

type CreatePaymentResponse = {
  payment?: {
    id?: string;
    status?: string;
    receipt_url?: string;
  };
};

export async function createSquarePayment(input: {
  sourceId: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  locationId: string;
  orderId: string;
  note: string;
  referenceId: string;
}): Promise<SquarePaymentResult> {
  const body = await squareFetch<CreatePaymentResponse>("/v2/payments", {
    method: "POST",
    body: {
      source_id: input.sourceId,
      idempotency_key: input.idempotencyKey,
      amount_money: {
        amount: input.amount,
        currency: input.currency,
      },
      location_id: input.locationId,
      order_id: input.orderId,
      autocomplete: true,
      note: input.note.slice(0, 500),
      reference_id: input.referenceId.slice(0, 40),
    },
  });

  const payment = body.payment;
  if (!payment?.id || !payment.status) {
    throw new Error("Square no devolvió el pago.");
  }

  return {
    id: payment.id,
    status: payment.status,
    receiptUrl: payment.receipt_url ?? null,
  };
}
