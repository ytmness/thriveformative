import { query } from "@/lib/db";
import { locationCountrySql } from "@/lib/domain/scope";
import { toErrorResponse } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { requestMeta } from "@/lib/http";
import { requestMarket } from "@/lib/site/requestMarket";
import { NextResponse } from "next/server";

function limited(req: Request) {
  const meta = requestMeta(req);
  const result = checkRateLimit(`public:${meta.ip || "unknown"}`, { limit: 60, windowMs: 60 * 1000 });
  if (!result.allowed) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  return null;
}

export async function GET(req: Request) {
  const blocked = limited(req);
  if (blocked) return blocked;
  try {
    const market = await requestMarket();
    const services = await query(
      `SELECT s.id, s.name, s.description, s.duration_minutes, s.price, s.category_id
       FROM services s
       WHERE s.is_active AND s.is_online_bookable
         AND (
           NOT EXISTS (SELECT 1 FROM service_locations sl WHERE sl.service_id = s.id)
           OR EXISTS (
             SELECT 1 FROM service_locations sl
             JOIN locations l ON l.id = sl.location_id
             WHERE sl.service_id = s.id AND l.is_active AND ${locationCountrySql("l.country", "$1")}
           )
         )
       ORDER BY s.name`,
      [market]
    );
    const locations = await query(
      `SELECT id, name, city, timezone FROM locations
       WHERE is_active AND ${locationCountrySql("country", "$1")}
       ORDER BY name`,
      [market]
    );
    const staff = await query(
      `SELECT id, first_name, last_name, calendar_color FROM staff_users WHERE is_active AND is_bookable ORDER BY first_name`
    );
    const settings = await query(`SELECT min_advance_hours, max_advance_days, cancel_window_hours, allow_reschedule, allow_waitlist, require_terms FROM booking_settings WHERE id = 1`);
    const policy = await query(`SELECT value FROM clinic_settings WHERE key = 'cancellation_policy'`);
    return Response.json({
      services: services.rows,
      locations: locations.rows,
      staff: staff.rows,
      settings: settings.rows[0] ?? null,
      policy: policy.rows[0]?.value ?? null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
