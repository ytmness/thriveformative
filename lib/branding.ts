import type { SiteMarket } from "@/lib/site/market";

/** Logo de marca unificado (mismo PNG que en tema golden-sand en nav/footer). */
export const SITE_LOGO_SRC = "/logos/Logo-Golden-Sand-color-06.png";

/** WhatsApp / teléfono consultorio México (+52 81 2003 6699) */
export const CLINIC_PHONE_MX_E164 = "528120036699";
export const CLINIC_PHONE_MX_DISPLAY = "+52 81 2003 6699";
export const CLINIC_PHONE_MX_TEL = `tel:+${CLINIC_PHONE_MX_E164}`;
export const WHATSAPP_PHONE_MX_E164 = CLINIC_PHONE_MX_E164;
export const WHATSAPP_LINK_MX = `https://wa.me/${WHATSAPP_PHONE_MX_E164}`;

/** Teléfono consultorio EUA (+1 956 462 7150) */
export const CLINIC_PHONE_US_E164 = "19564627150";
export const CLINIC_PHONE_US_DISPLAY = "+1 (956) 462-7150";
export const CLINIC_PHONE_US_TEL = `tel:+${CLINIC_PHONE_US_E164}`;

/** Exports por región (legacy para compatibilidad - default MX) */
export const CLINIC_PHONE_E164 = CLINIC_PHONE_MX_E164;
export const CLINIC_PHONE_DISPLAY = CLINIC_PHONE_MX_DISPLAY;
export const CLINIC_PHONE_TEL = CLINIC_PHONE_MX_TEL;
export const WHATSAPP_PHONE_E164 = WHATSAPP_PHONE_MX_E164;
export const WHATSAPP_LINK = WHATSAPP_LINK_MX;

/** Obtener teléfono según región */
export function getClinicPhone(market: SiteMarket) {
  if (market === "US") {
    return {
      e164: CLINIC_PHONE_US_E164,
      display: CLINIC_PHONE_US_DISPLAY,
      tel: CLINIC_PHONE_US_TEL,
    };
  }
  return {
    e164: CLINIC_PHONE_MX_E164,
    display: CLINIC_PHONE_MX_DISPLAY,
    tel: CLINIC_PHONE_MX_TEL,
  };
}

/** Obtener WhatsApp según región (solo MX tiene WhatsApp por ahora) */
export function getWhatsAppLink(market: SiteMarket) {
  if (market === "US") {
    return null;
  }
  return WHATSAPP_LINK_MX;
}

/** Dirección del consultorio */
export const CLINIC_ADDRESS_LINE =
  "R. de la Plata 103 Local 9, Del Valle, San Pedro Garza García, Nuevo León 66220, México";

const CLINIC_MAPS_QUERY = encodeURIComponent(CLINIC_ADDRESS_LINE);

/** Mapa embebido (Google Maps) */
export const CLINIC_MAP_EMBED_URL = `https://maps.google.com/maps?q=${CLINIC_MAPS_QUERY}&hl=es&z=16&output=embed`;

/** Abrir en Google Maps */
export const CLINIC_MAP_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${CLINIC_MAPS_QUERY}`;
