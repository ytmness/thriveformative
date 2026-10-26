import { slugifyRef } from "@/lib/store/slug";

const SERVICE_SLUGS = new Set(["service", "services", "servicio", "servicios"]);

export const CLINIC_SERVICE_CATEGORY_SLUGS = [...SERVICE_SLUGS];

export function isClinicServiceCategory(nameOrSlug: string | null | undefined): boolean {
  return SERVICE_SLUGS.has(slugifyRef(nameOrSlug || ""));
}
