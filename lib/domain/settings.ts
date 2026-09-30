import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import type { StaffSession } from "@/lib/auth/session";
import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { generateTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";

type Column = { key: string; column: string };

const SIMPLE: Record<string, { table: string; columns: Column[] }> = {
  locations: {
    table: "locations",
    columns: [
      { key: "name", column: "name" },
      { key: "timezone", column: "timezone" },
      { key: "street", column: "street" },
      { key: "city", column: "city" },
      { key: "state", column: "state" },
      { key: "country", column: "country" },
      { key: "postalCode", column: "postal_code" },
      { key: "phone", column: "phone" },
      { key: "email", column: "email" },
      { key: "isActive", column: "is_active" },
    ],
  },
  rooms: {
    table: "rooms",
    columns: [
      { key: "locationId", column: "location_id" },
      { key: "name", column: "name" },
      { key: "color", column: "color" },
      { key: "capacity", column: "capacity" },
      { key: "isActive", column: "is_active" },
    ],
  },
  "service-categories": {
    table: "service_categories",
    columns: [
      { key: "name", column: "name" },
      { key: "sortOrder", column: "sort_order" },
      { key: "isActive", column: "is_active" },
    ],
  },
  taxes: {
    table: "taxes",
    columns: [
      { key: "name", column: "name" },
      { key: "rate", column: "rate" },
      { key: "isDefault", column: "is_default" },
      { key: "isActive", column: "is_active" },
    ],
  },
  "payment-methods": {
    table: "payment_methods",
    columns: [
      { key: "key", column: "key" },
      { key: "name", column: "name" },
      { key: "isActive", column: "is_active" },
      { key: "sortOrder", column: "sort_order" },
    ],
  },
  "marketing-sources": {
    table: "marketing_sources",
    columns: [
      { key: "name", column: "name" },
      { key: "isActive", column: "is_active" },
    ],
  },
  tags: {
    table: "tags",
    columns: [
      { key: "name", column: "name" },
      { key: "color", column: "color" },
    ],
  },
  suppliers: {
    table: "suppliers",
    columns: [
      { key: "name", column: "name" },
      { key: "email", column: "email" },
      { key: "phone", column: "phone" },
      { key: "notes", column: "notes" },
    ],
  },
  "product-categories": {
    table: "product_categories",
    columns: [
      { key: "name", column: "name" },
      { key: "sortOrder", column: "sort_order" },
    ],
  },
  "lead-stages": {
    table: "lead_stages",
    columns: [
      { key: "name", column: "name" },
      { key: "sortOrder", column: "sort_order" },
      { key: "isWon", column: "is_won" },
      { key: "isLost", column: "is_lost" },
    ],
  },
  "custom-fields": {
    table: "custom_field_defs",
    columns: [
      { key: "entity", column: "entity" },
      { key: "fieldKey", column: "field_key" },
      { key: "label", column: "label" },
      { key: "fieldType", column: "field_type" },
      { key: "options", column: "options" },
      { key: "isRequired", column: "is_required" },
      { key: "sortOrder", column: "sort_order" },
      { key: "isActive", column: "is_active" },
    ],
  },
  schedules: {
    table: "staff_schedules",
    columns: [
      { key: "staffUserId", column: "staff_user_id" },
      { key: "locationId", column: "location_id" },
      { key: "dayOfWeek", column: "day_of_week" },
      { key: "startTime", column: "start_time" },
      { key: "endTime", column: "end_time" },
      { key: "validFrom", column: "valid_from" },
      { key: "validTo", column: "valid_to" },
    ],
  },
  "message-templates": {
    table: "message_templates",
    columns: [
      { key: "channel", column: "channel" },
      { key: "templateKey", column: "template_key" },
      { key: "locale", column: "locale" },
      { key: "subject", column: "subject" },
      { key: "body", column: "body" },
      { key: "isActive", column: "is_active" },
    ],
  },
  "message-rules": {
    table: "message_rules",
    columns: [
      { key: "triggerKey", column: "trigger_key" },
      { key: "offsetMinutes", column: "offset_minutes" },
      { key: "channel", column: "channel" },
      { key: "templateId", column: "template_id" },
      { key: "isActive", column: "is_active" },
    ],
  },
};

function valuesFor(columns: Column[], body: Record<string, unknown>) {
  return columns.map((column) => {
    const value = body[column.key];
    if (column.column === "options" && value != null) return JSON.stringify(value);
    return value === undefined ? null : value;
  });
}

export async function listSection(section: string) {
  if (section === "booking") {
    const rows = await query(`SELECT * FROM booking_settings WHERE id = 1`);
    return rows.rows;
  }
  if (section === "clinic") {
    const rows = await query(`SELECT key, value FROM clinic_settings ORDER BY key`);
    return rows.rows;
  }
  if (section === "services") {
    const rows = await query(
      `SELECT s.*, c.name AS category_name, t.rate AS tax_rate
       FROM services s
       LEFT JOIN service_categories c ON c.id = s.category_id
       LEFT JOIN taxes t ON t.id = s.tax_id
       ORDER BY s.name`
    );
    const links = await Promise.all([
      query(`SELECT * FROM service_locations`),
      query(`SELECT * FROM service_staff`),
      query(`SELECT * FROM service_rooms`),
    ]);
    return rows.rows.map((row) => ({
      ...row,
      locationIds: links[0].rows.filter((link) => link.service_id === row.id).map((link) => link.location_id),
      staffIds: links[1].rows.filter((link) => link.service_id === row.id).map((link) => link.staff_user_id),
      roomIds: links[2].rows.filter((link) => link.service_id === row.id).map((link) => link.room_id),
    }));
  }
  if (section === "staff") {
    const rows = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.job_title, u.calendar_color, u.phone, u.is_active,
              u.is_bookable, u.default_location_id, u.mfa_secret_enc IS NOT NULL AS mfa_enabled,
              coalesce(array_agg(r.key) FILTER (WHERE r.key IS NOT NULL), '{}') AS roles
       FROM staff_users u
       LEFT JOIN staff_user_roles sur ON sur.staff_user_id = u.id
       LEFT JOIN roles r ON r.id = sur.role_id
       GROUP BY u.id
       ORDER BY u.last_name, u.first_name`
    );
    return rows.rows.map((row) => ({ ...row, mfa_secret_enc: undefined }));
  }
  if (section === "packages") {
    const rows = await query(`SELECT * FROM packages WHERE is_active ORDER BY name`);
    const items = await query(`SELECT * FROM package_items`);
    return rows.rows.map((row) => ({ ...row, items: items.rows.filter((item) => item.package_id === row.id) }));
  }
  if (section === "memberships") return (await query(`SELECT * FROM memberships WHERE is_active ORDER BY name`)).rows;
  if (section === "gift-cards") return (await query(`SELECT * FROM gift_cards ORDER BY created_at DESC`)).rows;
  if (section === "lead-stages") return (await query(`SELECT * FROM lead_stages ORDER BY sort_order, name`)).rows;
  const spec = SIMPLE[section];
  if (!spec) throw new DomainError("Sección no encontrada.", 404);
  const rows = await query(`SELECT * FROM ${spec.table} ORDER BY 1`);
  return rows.rows;
}

export async function createSection(section: string, body: Record<string, unknown>, actor: StaffSession) {
  if (section === "services") return saveService(null, body);
  if (section === "staff") return saveStaff(null, body, actor);
  if (section === "booking") return updateBooking(body);
  if (section === "clinic") return updateClinic(body);
  const spec = SIMPLE[section];
  if (!spec) throw new DomainError("Sección no encontrada.", 404);
  const columns = spec.columns.map((column) => column.column);
  const placeholders = columns.map((column, index) => (column === "options" ? `$${index + 1}::jsonb` : `$${index + 1}`));
  const inserted = await query<{ id: string }>(
    `INSERT INTO ${spec.table} (${columns.join(",")}) VALUES (${placeholders.join(",")}) RETURNING id`,
    valuesFor(spec.columns, body)
  );
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: `${section}.create`, entityType: section, entityId: inserted.rows[0].id });
  return { id: inserted.rows[0].id };
}

export async function updateSection(section: string, id: string, body: Record<string, unknown>, actor: StaffSession) {
  if (section === "services") return saveService(id, body);
  if (section === "staff") return saveStaff(id, body, actor);
  if (section === "booking") return updateBooking(body);
  if (section === "clinic") return updateClinic(body);
  const spec = SIMPLE[section];
  if (!spec) throw new DomainError("Sección no encontrada.", 404);
  const assignments = spec.columns.map((column, index) =>
    column.column === "options" ? `${column.column} = $${index + 2}::jsonb` : `${column.column} = $${index + 2}`
  );
  await query(`UPDATE ${spec.table} SET ${assignments.join(", ")} WHERE id = $1`, [id, ...valuesFor(spec.columns, body)]);
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: `${section}.update`, entityType: section, entityId: id });
  return { id };
}

export async function deleteSection(section: string, id: string, actor: StaffSession) {
  if (section === "staff") {
    await query(`UPDATE staff_users SET is_active = false WHERE id = $1`, [id]);
    return { id };
  }
  const spec = section === "services" ? { table: "services" } : SIMPLE[section];
  if (!spec) throw new DomainError("Sección no encontrada.", 404);
  await query(`DELETE FROM ${spec.table} WHERE id = $1`, [id]);
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: `${section}.delete`, entityType: section, entityId: id });
  return { id };
}

async function saveService(id: string | null, body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  if (!name) throw new DomainError("El nombre del servicio es obligatorio.");
  const values = [
    body.categoryId || null,
    name,
    body.description || "",
    body.durationMinutes || 30,
    body.bufferBeforeMinutes || 0,
    body.bufferAfterMinutes || 0,
    body.price === "" || body.price == null ? 0 : body.price,
    body.taxId || null,
    body.color || "#d4a473",
    body.isOnlineBookable !== false,
    body.depositAmount === "" || body.depositAmount == null ? null : body.depositAmount,
    body.requiredFormTemplateId || null,
    body.isActive !== false,
  ];
  let serviceId = id;
  if (!serviceId) {
    const inserted = await query<{ id: string }>(
      `INSERT INTO services (category_id, name, description, duration_minutes, buffer_before_minutes, buffer_after_minutes,
         price, tax_id, color, is_online_bookable, deposit_amount, required_form_template_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      values
    );
    serviceId = inserted.rows[0].id;
  } else {
    await query(
      `UPDATE services SET category_id=$2, name=$3, description=$4, duration_minutes=$5, buffer_before_minutes=$6,
         buffer_after_minutes=$7, price=$8, tax_id=$9, color=$10, is_online_bookable=$11, deposit_amount=$12,
         required_form_template_id=$13, is_active=$14 WHERE id=$1`,
      [serviceId, ...values]
    );
  }
  await query(`DELETE FROM service_locations WHERE service_id = $1`, [serviceId]);
  await query(`DELETE FROM service_staff WHERE service_id = $1`, [serviceId]);
  await query(`DELETE FROM service_rooms WHERE service_id = $1`, [serviceId]);
  for (const locationId of (body.locationIds as string[]) || []) {
    await query(`INSERT INTO service_locations (service_id, location_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [serviceId, locationId]);
  }
  for (const staffId of (body.staffIds as string[]) || []) {
    await query(`INSERT INTO service_staff (service_id, staff_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [serviceId, staffId]);
  }
  for (const roomId of (body.roomIds as string[]) || []) {
    await query(`INSERT INTO service_rooms (service_id, room_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [serviceId, roomId]);
  }
  return { id: serviceId };
}

async function saveStaff(id: string | null, body: Record<string, unknown>, actor: StaffSession) {
  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  if (!email || !firstName || !lastName) throw new DomainError("Email, nombre y apellido son obligatorios.");
  let staffId = id;
  if (!staffId) {
    const password = String(body.password || "");
    if (password.length < 10) throw new DomainError("La contraseña debe tener al menos 10 caracteres.");
    const inserted = await query<{ id: string }>(
      `INSERT INTO staff_users (email, email_normalized, password_hash, first_name, last_name, job_title, calendar_color, phone, is_active, is_bookable, default_location_id)
       VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [email, await hashPassword(password), firstName, lastName, body.jobTitle || null, body.calendarColor || "#d4a473", body.phone || null, body.isActive !== false, Boolean(body.isBookable), body.defaultLocationId || null]
    );
    staffId = inserted.rows[0].id;
  } else {
    await query(
      `UPDATE staff_users SET email=$2, email_normalized=$2, first_name=$3, last_name=$4, job_title=$5, calendar_color=$6,
         phone=$7, is_active=$8, is_bookable=$9, default_location_id=$10 WHERE id=$1`,
      [staffId, email, firstName, lastName, body.jobTitle || null, body.calendarColor || "#d4a473", body.phone || null, body.isActive !== false, Boolean(body.isBookable), body.defaultLocationId || null]
    );
    if (typeof body.password === "string" && body.password.length >= 10) {
      await query(`UPDATE staff_users SET password_hash = $2 WHERE id = $1`, [staffId, await hashPassword(body.password)]);
    }
  }
  if (Array.isArray(body.roles)) {
    await query(`DELETE FROM staff_user_roles WHERE staff_user_id = $1`, [staffId]);
    for (const role of body.roles) {
      await query(
        `INSERT INTO staff_user_roles (staff_user_id, role_id) SELECT $1, id FROM roles WHERE key = $2`,
        [staffId, role]
      );
    }
  }
  await writeAudit({ actorType: "staff", actorId: actor.staff.id, action: "staff.save", entityType: "staff", entityId: staffId });
  return { id: staffId };
}

async function updateBooking(body: Record<string, unknown>) {
  await query(
    `UPDATE booking_settings SET slot_interval_minutes=$1, min_advance_hours=$2, max_advance_days=$3,
       cancel_window_hours=$4, allow_reschedule=$5, allow_waitlist=$6, require_terms=$7 WHERE id = 1`,
    [
      body.slotIntervalMinutes ?? 15,
      body.minAdvanceHours ?? 2,
      body.maxAdvanceDays ?? 90,
      body.cancelWindowHours ?? 24,
      body.allowReschedule !== false,
      body.allowWaitlist !== false,
      body.requireTerms !== false,
    ]
  );
  return { id: "1" };
}

async function updateClinic(body: Record<string, unknown>) {
  const key = String(body.key || "");
  if (!key) throw new DomainError("Falta la clave de configuración.");
  await query(
    `INSERT INTO clinic_settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(body.value ?? {})]
  );
  return { id: key };
}

export async function beginMfa(actor: StaffSession) {
  const secret = generateTotpSecret();
  await query(`UPDATE staff_users SET mfa_secret_enc = $2 WHERE id = $1`, [actor.staff.id, encryptPhi(secret)]);
  const issuer = "Thrive Formative";
  return { secret, otpauth: `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(actor.staff.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}` };
}

export async function confirmMfa(actor: StaffSession, code: string) {
  const row = await query<{ mfa_secret_enc: Buffer | null }>(`SELECT mfa_secret_enc FROM staff_users WHERE id = $1`, [actor.staff.id]);
  const secret = decryptPhi(row.rows[0]?.mfa_secret_enc);
  if (!secret || !verifyTotp(secret, code)) {
    await query(`UPDATE staff_users SET mfa_secret_enc = NULL WHERE id = $1`, [actor.staff.id]);
    throw new DomainError("El código no es válido. Vuelve a generar el secreto.");
  }
  return { ok: true };
}
