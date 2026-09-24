/**
 * Pabau online booking — calendar of record for Thrive Formative.
 * Only NEXT_PUBLIC_* values are used here (safe for client components).
 * Server-side API token stays in PABAU_ACCESS_TOKEN (never NEXT_PUBLIC).
 */

export type PabauLocation = {
  id: number;
  name: string;
  city: string;
  timezone: string;
};

const DEFAULT_SLUG = "thrive-formative-llc";
const DEFAULT_PORTAL_ORIGIN = "https://partner-us.pabau.com";

export const PABAU_COMPANY_SLUG =
  process.env.NEXT_PUBLIC_PABAU_COMPANY_SLUG?.trim() || DEFAULT_SLUG;

const portalBase = `${DEFAULT_PORTAL_ORIGIN}/online-bookings/${PABAU_COMPANY_SLUG}`;

export const PABAU_BOOKING_URL =
  process.env.NEXT_PUBLIC_PABAU_BOOKING_URL?.trim() || portalBase;

/** ShapeScale service deep link (category Diagnostics 314027, service 3571762). */
export const PABAU_BOOKING_SHAPESCALE_URL =
  process.env.NEXT_PUBLIC_PABAU_BOOKING_SHAPESCALE_URL?.trim() ||
  `${portalBase}?category=314027&services=3571762`;

/**
 * Official Pabau “Book Now” script URL (Promote → Book Now button).
 * The site uses a branded Thrive CTA → PABAU_BOOKING_URL instead of loading this script.
 */
export const PABAU_BOOK_NOW_SCRIPT_SRC = `https://pabau.com/widgets/online-bookings/book-now-button.js?company_slug=${PABAU_COMPANY_SLUG}&btnStyle=1`;

/** Locations known in Pabau. Expand when new branches are added. */
export const PABAU_LOCATIONS: readonly PabauLocation[] = [
  {
    id: 24216,
    name: "Thrive Formative LLC",
    city: "Laredo, TX",
    timezone: "America/Chicago",
  },
] as const;

export type PabauBookingUrlOptions = {
  category?: number | string;
  services?: number | string;
  location?: number | string;
};

/** Build a portal deep link with optional category / service / location filters. */
export function pabauBookingUrl(options: PabauBookingUrlOptions = {}): string {
  const url = new URL(PABAU_BOOKING_URL);
  if (options.category != null) {
    url.searchParams.set("category", String(options.category));
  }
  if (options.services != null) {
    url.searchParams.set("services", String(options.services));
  }
  if (options.location != null) {
    url.searchParams.set("location", String(options.location));
  }
  return url.toString();
}
