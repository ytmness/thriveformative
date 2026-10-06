import { getSiteUrl } from "@/lib/env/server";

export type ReaderChargeLinks = {
  iosUrl: string;
  androidUrl: string;
  callbackUrl: string;
};

export function readerCallbackUrl() {
  return `${getSiteUrl().replace(/\/$/, "")}/api/square/reader/callback`;
}

export function buildReaderChargeLinks(input: {
  amount: number;
  currency: string;
  state: string;
  note: string;
  locationId: string;
  applicationId: string;
}): ReaderChargeLinks {
  const callbackUrl = readerCallbackUrl();
  const ios = {
    amount_money: { amount: String(input.amount), currency_code: input.currency },
    callback_url: callbackUrl,
    client_id: input.applicationId,
    location_id: input.locationId,
    version: "1.3",
    state: input.state,
    notes: input.note.slice(0, 500),
    options: {
      supported_tender_types: ["CREDIT_CARD"],
      clear_default_fees: true,
      auto_return: true,
      skip_receipt: false,
    },
  };
  const iosUrl = `square-commerce-v1://payment/create?data=${encodeURIComponent(JSON.stringify(ios))}`;
  const androidUrl = [
    "intent:#Intent",
    "action=com.squareup.pos.action.CHARGE",
    "package=com.squareup",
    `S.browser_fallback_url=${callbackUrl}`,
    `S.com.squareup.pos.WEB_CALLBACK_URI=${callbackUrl}`,
    `S.com.squareup.pos.CLIENT_ID=${input.applicationId}`,
    `S.com.squareup.pos.API_VERSION=v2.0`,
    `S.com.squareup.pos.LOCATION_ID=${input.locationId}`,
    `i.com.squareup.pos.TOTAL_AMOUNT=${input.amount}`,
    `S.com.squareup.pos.CURRENCY_CODE=${input.currency}`,
    "S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD",
    "l.com.squareup.pos.AUTO_RETURN_TIMEOUT_MS=3200",
    `S.com.squareup.pos.NOTE=${input.note.slice(0, 500)}`,
    `S.com.squareup.pos.REQUEST_METADATA=${input.state}`,
    "end",
  ].join(";");
  return { iosUrl, androidUrl, callbackUrl };
}

export function readerErrorText(code: string | null) {
  if (code === "payment_canceled" || code === "TRANSACTION_CANCELED") return "El cobro se canceló en la app de Square.";
  if (code === "not_logged_in" || code === "USER_NOT_LOGGED_IN") return "Entra a la app de Square en este celular con la cuenta de la clínica.";
  if (code === "user_id_mismatch" || code === "ILLEGAL_LOCATION_ID") return "La app de Square está en otra sede. Entra con la sede de este cobro.";
  if (code === "no_network_connection" || code === "NO_NETWORK") return "El celular no tenía internet. El lector no pudo cobrar.";
  if (code === "could_not_perform" || code === "TRANSACTION_ALREADY_IN_PROGRESS") return "Hay un cobro abierto en la app de Square. Termínalo y vuelve a intentar.";
  if (!code) return "Square no confirmó el pago.";
  return `La app de Square no completó el cobro (${code}).`;
}
