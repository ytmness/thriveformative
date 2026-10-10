import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { hashPassword } from "@/lib/auth/password";
import { getPortalSession, openPortalSession } from "@/lib/auth/portal";
import { contactHash, decryptPhi, encryptPhi, normalizeEmail, normalizePhone } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendSavedTemplateEmail } from "@/lib/emailServer";
import { DomainError } from "@/lib/http";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type RegisterProfile = {
  fullName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  address?: string | null;
  contactPreference?: string | null;
  referralSource?: string | null;
  referralSourceOther?: string | null;
  locale?: string | null;
};

function codeDigest(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

function sameHash(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function splitName(fullName: string | null | undefined) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Paciente", last: "." };
  if (parts.length === 1) return { first: parts[0], last: "." };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function mapSex(value: string | null | undefined) {
  const sex = String(value || "").toLowerCase();
  if (sex === "female" || sex === "femenino") return "femenino";
  if (sex === "male" || sex === "masculino") return "masculino";
  if (sex === "other" || sex === "otro") return "otro";
  return null;
}

const SOURCE_NAMES: Record<string, string> = {
  website: "Sitio web",
  doctor: "Referido",
  friend_family: "Referido",
  social_media: "Instagram",
  ads_meta_tiktok: "Facebook",
  ads_google: "Google",
  other: "Otro",
};

async function findPatient(email: string) {
  const hash = contactHash("email", email);
  const found = await query<{ id: string }>(
    `SELECT id FROM patients WHERE email_hash = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`,
    [hash]
  );
  return found.rows[0]?.id ?? null;
}

async function sourceId(referral: string | null | undefined) {
  const name = SOURCE_NAMES[String(referral || "")] || null;
  if (!name) return null;
  const found = await query<{ id: string }>(
    `SELECT id FROM marketing_sources WHERE lower(name) = lower($1) AND is_active LIMIT 1`,
    [name]
  );
  return found.rows[0]?.id ?? null;
}

async function ensureAccount(patientId: string, email: string) {
  const existing = await query<{ id: string }>(
    `SELECT id FROM patient_portal_accounts WHERE patient_id = $1`,
    [patientId]
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const passwordHash = await hashPassword(randomBytes(24).toString("base64url"));
  const created = await query<{ id: string }>(
    `INSERT INTO patient_portal_accounts (patient_id, email_hash, email_enc, password_hash)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (patient_id) DO UPDATE SET is_active = true
     RETURNING id`,
    [patientId, contactHash("email", email), encryptPhi(email), passwordHash]
  );
  return created.rows[0].id;
}

async function saveProfile(email: string, profile: RegisterProfile) {
  const names = splitName(profile.fullName);
  const sex = mapSex(profile.sex);
  const phone = normalizePhone(profile.phone);
  const birth = profile.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate) ? profile.birthDate : null;
  const source = await sourceId(profile.referralSource);
  const referred = profile.referralSource === "other" ? profile.referralSourceOther || null : profile.referralSource || null;
  const preference = profile.contactPreference || "";
  let patientId = await findPatient(email);
  if (!patientId) {
    const code = await query<{ code: string }>(
      `SELECT 'TF-' || lpad(nextval('patient_code_seq')::text, 5, '0') AS code`
    );
    const inserted = await query<{ id: string }>(
      `INSERT INTO patients (
         client_code, first_name, last_name, sex, birth_date, preferred_language, marketing_source_id,
         referred_by_name, email_enc, email_hash, mobile_enc, mobile_hash, street,
         consent_email, consent_phone, consent_sms
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,$14,$15)
       RETURNING id`,
      [
        code.rows[0].code,
        names.first,
        names.last,
        sex,
        birth,
        profile.locale === "en" ? "en" : "es",
        source,
        referred,
        encryptPhi(email),
        contactHash("email", email),
        encryptPhi(phone),
        contactHash("phone", phone),
        profile.address?.trim() || null,
        preference === "call",
        preference === "whatsapp",
      ]
    );
    patientId = inserted.rows[0].id;
  } else {
    await query(
      `UPDATE patients SET
         first_name = $2,
         last_name = $3,
         sex = COALESCE($4, sex),
         birth_date = COALESCE($5, birth_date),
         marketing_source_id = COALESCE($6, marketing_source_id),
         referred_by_name = COALESCE($7, referred_by_name),
         mobile_enc = COALESCE($8, mobile_enc),
         mobile_hash = COALESCE($9, mobile_hash),
         street = COALESCE($10, street),
         consent_email = true,
         updated_at = now()
       WHERE id = $1`,
      [
        patientId,
        names.first,
        names.last,
        sex,
        birth,
        source,
        referred,
        encryptPhi(phone),
        contactHash("phone", phone),
        profile.address?.trim() || null,
      ]
    );
  }
  return ensureAccount(patientId, email);
}

export async function sendPatientCode(input: { email: string; locale?: string; purpose: "login" | "register" }) {
  const email = normalizeEmail(input.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainError(input.locale === "en" ? "Enter a valid email." : "Escribe un correo válido.");
  }
  if (input.purpose === "login" && !(await findPatient(email))) {
    throw new DomainError(input.locale === "en" ? "No account with that email. Please register." : "No hay una cuenta con ese correo. Regístrate.");
  }
  const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
  await query(
    `INSERT INTO patient_login_codes (email_hash, code_hash, purpose, expires_at)
     VALUES ($1,$2,$3,$4)`,
    [contactHash("email", email), codeDigest(email, code), input.purpose, new Date(Date.now() + CODE_TTL_MS).toISOString()]
  );
  const fallback = input.locale === "en"
    ? {
        subject: "Your Thrive Formative code",
        text: `Hello,\n\nYour Thrive Formative access code is:\n\n${code}\n\nIt expires in a few minutes. If you did not ask for it, ignore this email.`,
      }
    : {
        subject: "Tu código de Thrive Formative",
        text: `Hola,\n\nTu código de acceso a Thrive Formative es:\n\n${code}\n\nCaduca en unos minutos. Si no lo pediste, ignora este correo.`,
      };
  const sent = await sendSavedTemplateEmail({
    templateKey: "acceso",
    locale: input.locale === "en" ? "en" : "es",
    to: email,
    vars: { codigo: code, email },
    fallbackSubject: fallback.subject,
    fallbackText: fallback.text,
  });
  if (!sent.ok) throw new DomainError(input.locale === "en" ? "Could not send the email." : "No se pudo enviar el correo.", 502);
}

export async function verifyPatientCode(input: {
  email: string;
  code: string;
  purpose: "login" | "register";
  profile?: RegisterProfile;
  meta?: { ip?: string | null; userAgent?: string | null };
}) {
  const email = normalizeEmail(input.email);
  const code = input.code.replace(/\D/g, "");
  if (!email || code.length !== 8) throw new DomainError("Código incorrecto o expirado.");
  const found = await query<{ id: string; code_hash: string; attempts: number }>(
    `SELECT id, code_hash, attempts
     FROM patient_login_codes
     WHERE email_hash = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [contactHash("email", email), input.purpose]
  );
  const row = found.rows[0];
  if (!row || row.attempts >= MAX_ATTEMPTS || !sameHash(row.code_hash, codeDigest(email, code))) {
    if (row) await query(`UPDATE patient_login_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    throw new DomainError("Código incorrecto o expirado.");
  }
  await query(`UPDATE patient_login_codes SET consumed_at = now() WHERE id = $1`, [row.id]);
  const accountId = input.purpose === "register"
    ? await saveProfile(email, input.profile || {})
    : await (async () => {
        const patientId = await findPatient(email);
        if (!patientId) throw new DomainError("No hay una cuenta con ese correo. Regístrate.");
        return ensureAccount(patientId, email);
      })();
  await openPortalSession(accountId, input.meta);
  return { email };
}

export async function currentPatient() {
  const session = await getPortalSession();
  if (!session) return null;
  const account = await query<{ email_enc: Buffer | null }>(
    `SELECT email_enc FROM patient_portal_accounts WHERE patient_id = $1 AND is_active`,
    [session.patientId]
  );
  return {
    id: session.patientId,
    email: decryptPhi(account.rows[0]?.email_enc) || "",
    name: `${session.firstName || ""} ${session.lastName || ""}`.trim(),
  };
}
