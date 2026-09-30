import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { countrySql, normalizeCountry } from "@/lib/domain/scope";

function scopeOf(url: URL) {
  return {
    locationId: url.searchParams.get("locationId") || null,
    country: normalizeCountry(url.searchParams.get("country")),
  };
}

export async function runReport(slug: string, url: URL) {
  const from = url.searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = url.searchParams.get("to") || new Date().toISOString();
  const { locationId, country } = scopeOf(url);
  const scope = [from, to, locationId, country];
  if (slug === "citas") {
    const rows = await query(
      `SELECT status, count(*)::int AS total FROM appointments
       WHERE starts_at >= $1 AND starts_at < $2
         AND ($3::uuid IS NULL OR location_id = $3)
         AND ${countrySql("location_id", "$4")}
       GROUP BY status ORDER BY status`,
      scope
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "ingresos") {
    const rows = await query(
      `SELECT date_trunc('day', pay.received_at) AS day, coalesce(sum(pay.amount),0)::float AS total
       FROM payments pay
       LEFT JOIN sales s ON s.id = pay.sale_id
       WHERE pay.status = 'succeeded' AND pay.received_at >= $1 AND pay.received_at < $2
         AND ($3::uuid IS NULL OR s.location_id = $3)
         AND ${countrySql("s.location_id", "$4")}
       GROUP BY 1 ORDER BY 1`,
      scope
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "servicios") {
    const rows = await query(
      `SELECT description, sum(quantity)::float AS quantity, sum(line_total)::float AS total
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= $1 AND s.created_at < $2 AND s.status <> 'void'
         AND ($3::uuid IS NULL OR s.location_id = $3)
         AND ${countrySql("s.location_id", "$4")}
       GROUP BY description ORDER BY total DESC LIMIT 20`,
      scope
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "profesionales") {
    const rows = await query(
      `SELECT u.first_name, u.last_name,
              count(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int AS completed,
              count(DISTINCT a.id) FILTER (WHERE a.status = 'no_show')::int AS no_shows,
              coalesce(sum(si.line_total),0)::float AS revenue
       FROM staff_users u
       LEFT JOIN appointments a ON a.staff_user_id = u.id AND a.starts_at >= $1 AND a.starts_at < $2
         AND ($3::uuid IS NULL OR a.location_id = $3)
         AND ${countrySql("a.location_id", "$4")}
       LEFT JOIN sale_items si ON si.staff_user_id = u.id
       LEFT JOIN sales s ON s.id = si.sale_id AND s.created_at >= $1 AND s.created_at < $2 AND s.status <> 'void'
         AND ($3::uuid IS NULL OR s.location_id = $3)
         AND ${countrySql("s.location_id", "$4")}
       GROUP BY u.id ORDER BY revenue DESC`,
      scope
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "marketing") {
    const rows = await query(
      `SELECT coalesce(ms.name, 'Sin fuente') AS source, count(*)::int AS total
       FROM patients p LEFT JOIN marketing_sources ms ON ms.id = p.marketing_source_id
       WHERE p.deleted_at IS NULL AND p.created_at >= $1 AND p.created_at < $2
         AND ($3::uuid IS NULL OR p.location_id = $3)
         AND ${countrySql("p.location_id", "$4")}
       GROUP BY ms.name ORDER BY total DESC`,
      scope
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "no-shows") {
    const rows = await query(
      `SELECT date_trunc('week', starts_at) AS week,
              count(*)::int AS total,
              count(*) FILTER (WHERE status = 'no_show')::int AS no_shows
       FROM appointments WHERE starts_at >= $1 AND starts_at < $2
         AND ($3::uuid IS NULL OR location_id = $3)
         AND ${countrySql("location_id", "$4")}
       GROUP BY 1 ORDER BY 1`,
      scope
    );
    return { slug, from, to, rows: rows.rows };
  }
  throw new DomainError("Reporte no encontrado.", 404);
}

export async function dashboardStats(
  timeZone = "America/Chicago",
  scope: { locationId?: string | null; country?: string | null } = {}
) {
  const locationId = scope.locationId || null;
  const country = normalizeCountry(scope.country);
  const filters = [timeZone, locationId, country];
  const place = countrySql("a.location_id", "$3");
  const rows = await query<{
    appointments: number;
    revenue: string;
    new_patients: number;
    open_leads: number;
    patients: number;
    services: number;
  }>(
    `SELECT
       (SELECT count(*)::int FROM appointments a
         WHERE a.status NOT IN ('cancelled')
           AND (a.starts_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
           AND ($2::uuid IS NULL OR a.location_id = $2)
           AND ${place}) AS appointments,
       (SELECT coalesce(sum(pay.amount),0)::text FROM payments pay
         JOIN sales sa ON sa.id = pay.sale_id
         WHERE pay.status = 'succeeded'
           AND (pay.received_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
           AND ($2::uuid IS NULL OR sa.location_id = $2)
           AND ${countrySql("sa.location_id", "$3")}) AS revenue,
       (SELECT count(*)::int FROM patients p
         WHERE p.deleted_at IS NULL
           AND (p.created_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date
           AND ($2::uuid IS NULL OR p.location_id = $2)
           AND ${countrySql("p.location_id", "$3")}) AS new_patients,
       (SELECT count(*)::int FROM leads l
         WHERE l.status = 'open' AND l.archived_at IS NULL
           AND ($2::uuid IS NULL OR l.location_id = $2)
           AND ${countrySql("l.location_id", "$3")}) AS open_leads,
       (SELECT count(*)::int FROM patients p
         WHERE p.deleted_at IS NULL
           AND ($2::uuid IS NULL OR p.location_id = $2)
           AND ${countrySql("p.location_id", "$3")}) AS patients,
       (SELECT count(DISTINCT s.id)::int FROM services s
         JOIN service_locations sl ON sl.service_id = s.id
         WHERE s.is_active
           AND ($2::uuid IS NULL OR sl.location_id = $2)
           AND ${countrySql("sl.location_id", "$3")}) AS services`,
    filters
  );
  const upcoming = await query(
    `SELECT a.id, a.starts_at, a.status, a.duration_minutes, p.first_name, p.last_name,
            s.name AS service_name, l.name AS location_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN locations l ON l.id = a.location_id
     WHERE a.status NOT IN ('cancelled','no_show') AND a.starts_at >= now() AND a.starts_at < now() + interval '1 day'
       AND ($2::uuid IS NULL OR a.location_id = $2)
       AND ${place}
     ORDER BY a.starts_at LIMIT 8`,
    filters
  );
  const sites = await query(
    `SELECT l.id, l.name, l.city, l.country,
       (SELECT count(*)::int FROM appointments a
         WHERE a.location_id = l.id AND a.status NOT IN ('cancelled')
           AND (a.starts_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date) AS appointments,
       (SELECT count(*)::int FROM patients p
         WHERE p.location_id = l.id AND p.deleted_at IS NULL) AS patients,
       (SELECT count(*)::int FROM service_locations sl
         JOIN services s ON s.id = sl.service_id
         WHERE sl.location_id = l.id AND s.is_active) AS services,
       (SELECT coalesce(sum(pay.amount),0)::float FROM payments pay
         JOIN sales sa ON sa.id = pay.sale_id
         WHERE sa.location_id = l.id AND pay.status = 'succeeded'
           AND (pay.received_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date) AS revenue
     FROM locations l
     WHERE l.is_active AND ${countrySql("l.id", "$2")}
     ORDER BY l.name`,
    [timeZone, country]
  );
  return { ...rows.rows[0], upcoming: upcoming.rows, sites: sites.rows };
}
