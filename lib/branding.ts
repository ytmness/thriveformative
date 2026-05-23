/** Logo de marca unificado (mismo PNG que en tema golden-sand en nav/footer). */
export const SITE_LOGO_SRC = "/logos/Logo-Golden-Sand-color-06.png";

/** WhatsApp / teléfono consultorio (+52 81 2003 6699) */
export const CLINIC_PHONE_E164 = "528120036699";
export const CLINIC_PHONE_DISPLAY = "+52 81 2003 6699";
export const CLINIC_PHONE_TEL = `tel:+${CLINIC_PHONE_E164}`;
export const WHATSAPP_PHONE_E164 = CLINIC_PHONE_E164;
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE_E164}`;

/** Dirección del consultorio */
export const CLINIC_ADDRESS_LINE =
  "R. de la Plata 103 Local 9, Del Valle, San Pedro Garza García, Nuevo León 66220, México";

const CLINIC_MAPS_QUERY = encodeURIComponent(CLINIC_ADDRESS_LINE);

/** Mapa embebido (Google Maps) */
export const CLINIC_MAP_EMBED_URL = `https://maps.google.com/maps?q=${CLINIC_MAPS_QUERY}&hl=es&z=16&output=embed`;

/** Abrir en Google Maps */
export const CLINIC_MAP_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${CLINIC_MAPS_QUERY}`;
