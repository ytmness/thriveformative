import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSquareLocation, SquareApiError } from "@/lib/square/client";
import { SquareConfigError } from "@/lib/square/config";
import { createSquareOrder, fulfillmentNote, type StoreFulfillment } from "@/lib/square/orders";
import { createSquarePayment } from "@/lib/square/payments";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import {
  getClientIp,
  invalidJsonResponse,
  InvalidJsonError,
  PayloadTooLargeError,
  payloadTooLargeResponse,
  rateLimitedResponse,
  readJsonBody,
} from "@/lib/security/request";
import { isValidRef } from "@/lib/store/slug";
import { assertPickupStock, insertStoreOrder } from "@/lib/store/storeOrders";
import { requestMarket } from "@/lib/site/requestMarket";
import { sellableVariations } from "@/lib/store/variations";

export const dynamic = "force-dynamic";

const lineSchema = z.object({
  ref: z.string().min(2).max(80),
  variationId: z.string().min(1).max(128),
  quantity: z.number().int().min(1).max(20),
});

const emailField = z.string().trim().email().max(160);

const fulfillmentSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("pickup"),
    name: z.string().trim().min(2).max(80),
    email: emailField,
    locationId: z.string().uuid(),
  }),
  z.object({
    method: z.literal("shipping"),
    name: z.string().trim().min(2).max(80),
    email: emailField,
    line1: z.string().trim().min(3).max(120),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(40),
    postalCode: z.string().trim().min(3).max(12),
    country: z.enum(["MX", "US"]),
  }),
]);

const bodySchema = z.object({
  locale: z.enum(["es", "en", "ko", "it"]),
  lines: z.array(lineSchema).min(1).max(20),
  sourceId: z.string().min(1).max(512),
  idempotencyKey: z.string().uuid(),
  fulfillment: fulfillmentSchema,
});

const RATE_LIMIT = { limit: 8, windowMs: 10 * 60 * 1000 };

type ProductPayRow = {
  ref: string;
  name: string;
  image_url: string | null;
  source: string | null;
  source_payload: unknown;
  price_min: unknown;
  currency: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`square-pay:${ip}`, RATE_LIMIT);
    if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSec);

    const raw = await readJsonBody(request);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success || parsed.data.lines.some((line) => !isValidRef(line.ref))) {
      return jsonError(400, "Solicitud inválida.");
    }

    const merged = new Map<string, { ref: string; variationId: string; quantity: number }>();
    for (const line of parsed.data.lines) {
      const key = `${line.ref}:${line.variationId}`;
      const current = merged.get(key);
      const quantity = Math.min(20, (current?.quantity ?? 0) + line.quantity);
      merged.set(key, { ref: line.ref, variationId: line.variationId, quantity });
    }
    const lines = [...merged.values()];

    const location = await getSquareLocation();
    const result = await query<ProductPayRow>(
      `SELECT ref, name, image_url, source, source_payload, price_min, currency
       FROM store_products
       WHERE locale = $1 AND is_published = true AND ref = ANY($2::text[])`,
      [parsed.data.locale, lines.map((line) => line.ref)]
    );
    const byRef = new Map(result.rows.map((row) => [row.ref, row]));

    const orderLines: {
      ref: string;
      name: string;
      variationName: string | null;
      quantity: number;
      amount: number;
      currency: string;
      imageUrl: string | null;
    }[] = [];
    for (const line of lines) {
      const product = byRef.get(line.ref);
      if (!product) return jsonError(404, "Un producto del carrito ya no está disponible.");
      const variation = sellableVariations({
        source: product.source,
        sourcePayload: product.source_payload,
        priceMin: product.price_min,
        currency: product.currency,
      }).find((row) => row.id === line.variationId);
      if (!variation) return jsonError(400, "La opción de producto no es válida.");
      if (variation.currency !== location.currency) {
        return jsonError(409, `El cobro de la tienda es en ${location.currency}.`);
      }
      const variationName = variation.name === "Estándar" ? null : variation.name;
      orderLines.push({
        ref: product.ref,
        name: product.name,
        variationName,
        quantity: line.quantity,
        amount: variation.amount,
        currency: variation.currency,
        imageUrl: product.image_url,
      });
    }

    const submitted = parsed.data.fulfillment;
    let fulfillment: StoreFulfillment;
    let locationId: string | null = null;
    let locationName: string | null = null;
    if (submitted.method === "pickup") {
      try {
        locationName = await assertPickupStock(
          parsed.data.locale,
          submitted.locationId,
          orderLines.map((line) => line.ref),
          await requestMarket()
        );
      } catch (error) {
        return jsonError(409, error instanceof Error ? error.message : "Esa sede no tiene los productos.");
      }
      locationId = submitted.locationId;
      fulfillment = { method: "pickup", name: submitted.name, locationName };
    } else {
      const { email: _buyerEmail, ...shipping } = submitted;
      fulfillment = shipping;
    }

    const order = await createSquareOrder({
      idempotencyKey: parsed.data.idempotencyKey,
      locationId: location.id,
      lines: orderLines.map((line) => ({
        name: line.variationName ? `${line.name} · ${line.variationName}` : line.name,
        quantity: line.quantity,
        amount: line.amount,
        currency: line.currency,
      })),
      fulfillment,
    });
    if (order.currency !== location.currency || order.totalAmount <= 0) {
      return jsonError(409, "El total del pedido no se puede cobrar.");
    }

    const payment = await createSquarePayment({
      sourceId: parsed.data.sourceId,
      idempotencyKey: `${parsed.data.idempotencyKey.replace(/-/g, "").slice(0, 32)}pay`,
      amount: order.totalAmount,
      currency: order.currency,
      locationId: location.id,
      orderId: order.id,
      note: `Thrive Formative · ${fulfillmentNote(fulfillment)} · ${orderLines.map((line) => line.name).join(", ")}`,
      referenceId: "tienda",
    });

    if (payment.status !== "COMPLETED" && payment.status !== "APPROVED") {
      return jsonError(402, "El pago no se completó. Revisa la tarjeta e inténtalo de nuevo.");
    }

    let saved = null;
    try {
      saved = await insertStoreOrder({
        locale: parsed.data.locale,
        fulfillment: fulfillment.method,
        locationId,
        locationName,
        recipientName: fulfillment.name,
        recipientEmail: submitted.email,
        addressLine1: fulfillment.method === "shipping" ? fulfillment.line1 : null,
        city: fulfillment.method === "shipping" ? fulfillment.city : null,
        state: fulfillment.method === "shipping" ? fulfillment.state : null,
        postalCode: fulfillment.method === "shipping" ? fulfillment.postalCode : null,
        country: fulfillment.method === "shipping" ? fulfillment.country : null,
        currency: order.currency,
        totalAmount: order.totalAmount,
        squareOrderId: order.id,
        squarePaymentId: payment.id,
        receiptUrl: payment.receiptUrl,
        lines: orderLines.map((line) => ({
          ref: line.ref,
          name: line.name,
          variationName: line.variationName,
          quantity: line.quantity,
          unitAmount: line.amount,
          currency: line.currency,
          imageUrl: line.imageUrl,
        })),
      });
    } catch (error) {
      console.error("store-order-save", error);
    }

    return jsonOk({
      paymentId: payment.id,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
      order: saved,
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return payloadTooLargeResponse();
    if (error instanceof InvalidJsonError) return invalidJsonResponse();
    if (error instanceof SquareConfigError) {
      return jsonError(503, "El pago con tarjeta no está disponible en este momento.");
    }
    if (error instanceof SquareApiError) {
      const declined =
        error.code === "CARD_DECLINED" || error.code === "CVV_FAILURE" || error.code === "INVALID_EXPIRATION";
      return jsonError(
        error.status === 401 ? 502 : 402,
        declined
          ? "La tarjeta fue rechazada. Revisa los datos e inténtalo de nuevo."
          : "No se pudo completar el pago."
      );
    }
    return handleRouteError("square-payment", error);
  }
}
