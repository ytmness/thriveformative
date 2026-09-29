/**
 * Datos ficticios para una demo del panel.
 * Solo borra y vuelve a crear filas marcadas como DEMO-JEFES.
 * Uso en el servidor: node scripts/seed-demo.mjs
 */
import { createCipheriv, createHash, createHmac, randomBytes } from "crypto";
import { readFileSync, existsSync } from "fs";
import pg from "pg";
import { fromZonedTime } from "date-fns-tz";

const MARK = "DEMO-JEFES";
const TZ = "America/Chicago";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = value;
    }
  }
}

function phiKey() {
  const raw = process.env.PHI_ENCRYPTION_KEY?.trim();
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) throw new Error("PHI_ENCRYPTION_KEY debe ser 32 bytes en base64.");
    return buf;
  }
  const fallback = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  if (!fallback) throw new Error("Define PHI_ENCRYPTION_KEY.");
  return createHash("sha256").update(`thrive-phi:${fallback}`).digest();
}

const key = (() => {
  loadEnv();
  return phiKey();
})();

function encryptPhi(value) {
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), enc]);
}

function contactHash(kind, value) {
  const norm = kind === "email" ? value.trim().toLowerCase() : value.replace(/\D/g, "");
  if (!norm) return null;
  return createHmac("sha256", key).update(`${kind}:${norm}`).digest();
}

function clinicDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function at(dateKey, hm) {
  return fromZonedTime(`${dateKey}T${hm}:00`, TZ);
}

const PEOPLE = [
  ["Mariana", "Castillo", "mariana.castillo@demo.thriveformative.test", "9565550101", 0],
  ["Diego", "Herrera", "diego.herrera@demo.thriveformative.test", "9565550102", 0],
  ["Sofía", "Navarro", "sofia.navarro@demo.thriveformative.test", "9565550103", -6],
  ["Andrés", "Molina", "andres.molina@demo.thriveformative.test", "9565550104", -12],
  ["Lucía", "Paredes", "lucia.paredes@demo.thriveformative.test", "9565550105", -3],
  ["Camila", "Ortega", "camila.ortega@demo.thriveformative.test", "9565550106", -20],
  ["Javier", "Ríos", "javier.rios@demo.thriveformative.test", "9565550107", -8],
  ["Elena", "Vargas", "elena.vargas@demo.thriveformative.test", "9565550108", -15],
];

const LEADS = [
  ["Ana", "Beltrán", "9565550111", "Nuevo", 180, "Llamó por la consulta inicial."],
  ["Hugo", "Salinas", "9565550112", "Contactado", 220, "Pidió horarios de la tarde."],
  ["Valeria", "Cruz", "9565550113", "Cita agendada", 150, "Quiere traer estudios previos."],
  ["Mateo", "Ibáñez", "9565550114", "Nuevo", 300, "Vino por Instagram."],
  ["Inés", "Romero", "9565550115", "Contactado", 150, "Preguntó por el precio de la primera visita."],
];

const VISITS = [
  [-1, "09:00", "completed"],
  [-1, "11:00", "completed"],
  [0, "09:00", "completed"],
  [0, "10:30", "arrived"],
  [0, "12:00", "confirmed"],
  [0, "14:00", "booked"],
  [0, "15:30", "booked"],
  [0, "17:00", "confirmed"],
  [1, "09:30", "booked"],
  [1, "11:30", "booked"],
  [2, "10:00", "booked"],
  [3, "16:00", "booked"],
];

const SALES = [
  [0, 0, 150, "Consulta inicial"],
  [0, 1, 180, "Seguimiento"],
  [0, 4, 220, "Consulta inicial"],
  [-1, 2, 150, "Consulta inicial"],
  [-3, 5, 320, "Valoración"],
  [-6, 6, 150, "Consulta inicial"],
];

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL no está definida.");
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await clearDemo(client);
    const ctx = await context(client);
    const patients = [];
    for (const [first, last, email, mobile, dayOffset] of PEOPLE) {
      const id = await insertPatient(client, ctx, first, last, email, mobile, dayOffset);
      patients.push({ id, first, last });
    }
    const leads = [];
    for (const [first, last, mobile, stage, value, note] of LEADS) {
      leads.push(await insertLead(client, ctx, first, last, mobile, stage, value, note));
    }
    let placed = 0;
    for (let i = 0; i < VISITS.length; i++) {
      const [offset, hm, status] = VISITS[i];
      const patient = patients[i % patients.length];
      const ok = await insertVisit(client, ctx, patient.id, offset, hm, status);
      if (ok) placed += 1;
    }
    let revenueToday = 0;
    for (const [offset, patientIndex, amount, label] of SALES) {
      const when = at(clinicDate(offset), "13:00");
      await insertSale(client, ctx, patients[patientIndex].id, amount, label, when);
      if (offset === 0) revenueToday += amount;
    }
    await insertWaitlist(client, ctx, patients[7].id);
    await insertMessages(client, ctx, patients[0]);
    await client.query("COMMIT");
    console.log(JSON.stringify({
      ok: true,
      patients: patients.length,
      leads: leads.length,
      visits: placed,
      revenueToday,
      day: clinicDate(0),
    }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function clearDemo(client) {
  const patients = await client.query(`SELECT id FROM patients WHERE referred_by_name = $1`, [MARK]);
  const ids = patients.rows.map((row) => row.id);
  await client.query(`DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE notes = $1)`, [MARK]);
  await client.query(`DELETE FROM invoices WHERE sale_id IN (SELECT id FROM sales WHERE notes = $1)`, [MARK]);
  await client.query(`DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE notes = $1)`, [MARK]);
  await client.query(`DELETE FROM sales WHERE notes = $1`, [MARK]);
  await client.query(
    `DELETE FROM messages
     WHERE body LIKE $1
        OR appointment_id IN (SELECT id FROM appointments WHERE notes = $2)
        OR patient_id = ANY($3::uuid[])`,
    [`${MARK}%`, MARK, ids]
  );
  await client.query(`DELETE FROM appointments WHERE notes = $1`, [MARK]);
  await client.query(`DELETE FROM leads WHERE referred_by_name = $1`, [MARK]);
  if (ids.length) {
    await client.query(`DELETE FROM patients WHERE id = ANY($1::uuid[])`, [ids]);
  }
}

async function context(client) {
  const location = await client.query(`SELECT id, timezone FROM locations WHERE is_active IS DISTINCT FROM false ORDER BY created_at LIMIT 1`);
  if (!location.rows[0]) throw new Error("No hay sede. Crea una en Configuración antes de la demo.");
  const staff = await client.query(`SELECT id FROM staff_users WHERE is_active ORDER BY is_bookable DESC, created_at`);
  if (!staff.rows.length) throw new Error("No hay personal activo.");
  const services = await client.query(`SELECT id, name, duration_minutes, price FROM services WHERE is_active ORDER BY name`);
  const source = await client.query(`SELECT id FROM marketing_sources WHERE name IN ('Instagram', 'Sitio web') ORDER BY name LIMIT 1`);
  const stages = await client.query(`SELECT id, name FROM lead_stages ORDER BY sort_order`);
  const method = await client.query(`SELECT id FROM payment_methods WHERE key = 'card' AND is_active LIMIT 1`);
  return {
    locationId: location.rows[0].id,
    staff: staff.rows.map((row) => row.id),
    services: services.rows,
    sourceId: source.rows[0]?.id || null,
    stages: Object.fromEntries(stages.rows.map((row) => [row.name, row.id])),
    methodId: method.rows[0]?.id || null,
  };
}

async function insertPatient(client, ctx, first, last, email, mobile, dayOffset) {
  const code = await client.query(`SELECT 'TF-' || lpad(nextval('patient_code_seq')::text, 5, '0') AS code`);
  const created = at(clinicDate(dayOffset), "08:30");
  const inserted = await client.query(
    `INSERT INTO patients (
       client_code, location_id, first_name, last_name, preferred_language, marketing_source_id,
       referred_by_name, email_enc, email_hash, mobile_enc, mobile_hash, city, state, country,
       consent_sms, consent_email, privacy_policy_status, created_at
     ) VALUES ($1,$2,$3,$4,'es',$5,$6,$7,$8,$9,$10,'Laredo','TX','US', true, true, 'aceptado', $11)
     RETURNING id`,
    [
      code.rows[0].code, ctx.locationId, first, last, ctx.sourceId, MARK,
      encryptPhi(email), contactHash("email", email), encryptPhi(mobile), contactHash("phone", mobile), created,
    ]
  );
  return inserted.rows[0].id;
}

async function insertLead(client, ctx, first, last, mobile, stage, value, note) {
  const stageId = ctx.stages[stage] || ctx.stages.Nuevo;
  const email = `${first}.${last}@demo.thriveformative.test`.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const inserted = await client.query(
    `INSERT INTO leads (
       location_id, owner_staff_id, stage_id, status, first_name, last_name, marketing_source_id,
       referred_by_name, email_enc, email_hash, mobile_enc, mobile_hash, estimated_value, city, state
     ) VALUES ($1,$2,$3,'open',$4,$5,$6,$7,$8,$9,$10,$11,$12,'Laredo','TX') RETURNING id`,
    [
      ctx.locationId, ctx.staff[0], stageId, first, last, ctx.sourceId, MARK,
      encryptPhi(email), contactHash("email", email), encryptPhi(mobile), contactHash("phone", mobile), value,
    ]
  );
  await client.query(
    `INSERT INTO lead_activities (lead_id, staff_user_id, activity_type, body) VALUES ($1,$2,'note',$3)`,
    [inserted.rows[0].id, ctx.staff[0], note]
  );
  return inserted.rows[0].id;
}

async function insertVisit(client, ctx, patientId, offset, hm, status) {
  const service = ctx.services[0];
  const duration = Number(service?.duration_minutes) || 60;
  let start = at(clinicDate(offset), hm);
  for (let attempt = 0; attempt < 8; attempt++) {
    const end = new Date(start.getTime() + duration * 60000);
    for (const staffId of ctx.staff) {
      const clash = await client.query(
        `SELECT 1 FROM appointments
         WHERE staff_user_id = $1 AND status NOT IN ('cancelled', 'no_show')
           AND tstzrange(starts_at, ends_at, '[)') && tstzrange($2, $3, '[)')
         LIMIT 1`,
        [staffId, start, end]
      );
      if (clash.rows.length) continue;
      await client.query(
        `INSERT INTO appointments (
           patient_id, service_id, staff_user_id, location_id, starts_at, ends_at,
           duration_minutes, status, price, notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [patientId, service?.id || null, staffId, ctx.locationId, start, end, duration, status, service?.price || 150, MARK]
      );
      return true;
    }
    start = new Date(start.getTime() + 30 * 60000);
  }
  console.warn(`Sin hueco para ${clinicDate(offset)} ${hm}`);
  return false;
}

async function insertSale(client, ctx, patientId, amount, label, when) {
  const number = await client.query(`SELECT 'V-' || lpad(nextval('sale_number_seq')::text, 6, '0') AS n`);
  const invoiceNo = await client.query(`SELECT 'F-' || lpad(nextval('invoice_number_seq')::text, 6, '0') AS n`);
  const sale = await client.query(
    `INSERT INTO sales (
       sale_number, patient_id, location_id, staff_user_id, status, subtotal, total, paid_total, balance, notes, created_at
     ) VALUES ($1,$2,$3,$4,'paid',$5,$5,$5,0,$6,$7) RETURNING id`,
    [number.rows[0].n, patientId, ctx.locationId, ctx.staff[0], amount, MARK, when]
  );
  await client.query(
    `INSERT INTO sale_items (sale_id, item_type, description, quantity, unit_price, line_total, staff_user_id)
     VALUES ($1,'service',$2,1,$3,$3,$4)`,
    [sale.rows[0].id, label, amount, ctx.staff[0]]
  );
  const invoice = await client.query(
    `INSERT INTO invoices (
       invoice_number, sale_id, patient_id, location_id, issued_at, status, subtotal, total, paid_total, billing_snapshot
     ) VALUES ($1,$2,$3,$4,$5,'paid',$6,$6,$6,$7::jsonb) RETURNING id`,
    [invoiceNo.rows[0].n, sale.rows[0].id, patientId, ctx.locationId, when, amount, JSON.stringify({ name: label, demo: true })]
  );
  if (ctx.methodId) {
    await client.query(
      `INSERT INTO payments (sale_id, invoice_id, patient_id, method_id, amount, status, received_at)
       VALUES ($1,$2,$3,$4,$5,'succeeded',$6)`,
      [sale.rows[0].id, invoice.rows[0].id, patientId, ctx.methodId, amount, when]
    );
  }
}

async function insertWaitlist(client, ctx, patientId) {
  await client.query(
    `INSERT INTO waitlist_entries (patient_id, service_id, staff_user_id, location_id, notes, status)
     VALUES ($1,$2,$3,$4,$5,'waiting')`,
    [patientId, ctx.services[0]?.id || null, ctx.staff[0], ctx.locationId, MARK]
  );
}

async function insertMessages(client, ctx, patient) {
  const samples = [
    ["email", "sent", `${MARK} Tu cita de hoy está confirmada`],
    ["sms", "queued", `${MARK} Recordatorio: consulta a las 14:00`],
    ["email", "queued", `${MARK} Gracias por tu visita`],
  ];
  for (const [channel, status, body] of samples) {
    await client.query(
      `INSERT INTO messages (channel, recipient_enc, patient_id, subject, body, status, scheduled_for, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6, now(), CASE WHEN $6 = 'sent' THEN now() ELSE NULL END)`,
      [channel, encryptPhi(channel === "sms" ? "9565550101" : "mariana.castillo@demo.thriveformative.test"), patient.id, channel === "email" ? body : null, body, status]
    );
  }
  void ctx;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
