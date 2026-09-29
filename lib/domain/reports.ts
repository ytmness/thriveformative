import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";

export async function runReport(slug: string, url: URL) {
  const from = url.searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = url.searchParams.get("to") || new Date().toISOString();
  if (slug === "citas") {
    const rows = await query(
      `SELECT status, count(*)::int AS total FROM appointments
       WHERE starts_at >= $1 AND starts_at < $2 GROUP BY status ORDER BY status`,
      [from, to]
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "ingresos") {
    const rows = await query(
      `SELECT date_trunc('day', received_at) AS day, coalesce(sum(amount),0)::float AS total
       FROM payments WHERE status = 'succeeded' AND received_at >= $1 AND received_at < $2
       GROUP BY 1 ORDER BY 1`,
      [from, to]
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "servicios") {
    const rows = await query(
      `SELECT description, sum(quantity)::float AS quantity, sum(line_total)::float AS total
       FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= $1 AND s.created_at < $2 AND s.status <> 'void'
       GROUP BY description ORDER BY total DESC LIMIT 20`,
      [from, to]
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "profesionales") {
    const rows = await query(
      `SELECT u.first_name, u.last_name,
              count(*) FILTER (WHERE a.status = 'completed')::int AS completed,
              count(*) FILTER (WHERE a.status = 'no_show')::int AS no_shows,
              coalesce(sum(si.line_total),0)::float AS revenue
       FROM staff_users u
       LEFT JOIN appointments a ON a.staff_user_id = u.id AND a.starts_at >= $1 AND a.starts_at < $2
       LEFT JOIN sale_items si ON si.staff_user_id = u.id
       LEFT JOIN sales s ON s.id = si.sale_id AND s.created_at >= $1 AND s.created_at < $2 AND s.status <> 'void'
       GROUP BY u.id ORDER BY revenue DESC`,
      [from, to]
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "marketing") {
    const rows = await query(
      `SELECT coalesce(ms.name, 'Sin fuente') AS source, count(*)::int AS total
       FROM patients p LEFT JOIN marketing_sources ms ON ms.id = p.marketing_source_id
       WHERE p.deleted_at IS NULL AND p.created_at >= $1 AND p.created_at < $2
       GROUP BY ms.name ORDER BY total DESC`,
      [from, to]
    );
    return { slug, from, to, rows: rows.rows };
  }
  if (slug === "no-shows") {
    const rows = await query(
      `SELECT date_trunc('week', starts_at) AS week,
              count(*)::int AS total,
              count(*) FILTER (WHERE status = 'no_show')::int AS no_shows
       FROM appointments WHERE starts_at >= $1 AND starts_at < $2
       GROUP BY 1 ORDER BY 1`,
      [from, to]
    );
    return { slug, from, to, rows: rows.rows };
  }
  throw new DomainError("Reporte no encontrado.", 404);
}

export async function dashboardStats(timeZone = "America/Chicago") {
  const rows = await query<{
    appointments: number;
    revenue: string;
    new_patients: number;
    open_leads: number;
  }>(
    `SELECT
       (SELECT count(*)::int FROM appointments
         WHERE status NOT IN ('cancelled')
           AND (starts_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date) AS appointments,
       (SELECT coalesce(sum(amount),0)::text FROM payments
         WHERE status = 'succeeded'
           AND (received_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date) AS revenue,
       (SELECT count(*)::int FROM patients
         WHERE deleted_at IS NULL
           AND (created_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date) AS new_patients,
       (SELECT count(*)::int FROM leads WHERE status = 'open') AS open_leads`,
    [timeZone]
  );
  const upcoming = await query(
    `SELECT a.id, a.starts_at, a.status, a.duration_minutes, p.first_name, p.last_name, s.name AS service_name
     FROM appointments a
     LEFT JOIN patients p ON p.id = a.patient_id
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.status NOT IN ('cancelled','no_show') AND a.starts_at >= now() AND a.starts_at < now() + interval '1 day'
     ORDER BY a.starts_at LIMIT 8`
  );
  return { ...rows.rows[0], upcoming: upcoming.rows };
}
