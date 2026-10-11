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
  firstName?: string | null;
  middleName?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  address?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  sexDetail?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  acceptedPolicies?: boolean | null;
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

function patientNames(profile: RegisterProfile) {
  const given = profile.firstName?.trim() || "";
  const middle = profile.middleName?.trim() || "";
  const paternal = profile.paternalSurname?.trim() || "";
  const maternal = profile.maternalSurname?.trim() || "";
  if (given || middle || paternal || maternal) {
    const first = [given, middle].filter(Boolean).join(" ");
    const last = [paternal, maternal].filter(Boolean).join(" ");
    if (!first || !last) {
      throw new DomainError(
        profile.locale === "en"
          ? "Enter your first name and at least one last name."
          : "Escribe tu nombre y al menos un apellido."
      );
    }
    return { first, last, middle: middle || null, paternal: paternal || null, maternal: maternal || null };
  }
  const split = splitName(profile.fullName);
  return { first: split.first, last: split.last, middle: null, paternal: null, maternal: null };
}

function mapSex(value: string | null | undefined) {
  const sex = String(value || "").toLowerCase();
  if (sex === "female" || sex === "femenino") return "femenino";
  if (sex === "male" || sex === "masculino") return "masculino";
  if (sex === "other" || sex === "otro" || sex === "another") return "otro";
  if (sex === "prefer_not" || sex === "prefiere_no") return "prefiere_no";
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

async function defaultLocationId(country: string | null | undefined) {
  const code = (country || "MX").trim().toUpperCase();
  const us = code === "US" || code === "USA" || code === "UNITED STATES" || code === "ESTADOS UNIDOS";
  const found = await query<{ id: string }>(
    `SELECT id FROM locations
     WHERE upper(country) = ANY($1::text[])
     ORDER BY
       CASE WHEN name ILIKE $2 OR coalesce(city, '') ILIKE $2 THEN 0 ELSE 1 END,
       CASE WHEN is_active THEN 0 ELSE 1 END,
       name
     LIMIT 1`,
    [us ? ["US", "USA", "UNITED STATES", "ESTADOS UNIDOS"] : ["MX", "MEXICO", "MÉXICO"], us ? "%laredo%" : "%monterrey%"]
  );
  return found.rows[0]?.id ?? null;
}

async function saveProfile(email: string, profile: RegisterProfile, market?: "MX" | "US" | null) {
  if (profile.acceptedPolicies !== true) {
    throw new DomainError(profile.locale === "en" ? "Read and accept the policies before continuing." : "Lee y acepta las políticas antes de continuar.");
  }
  const names = patientNames(profile);
  const sex = mapSex(profile.sex);
  const phone = normalizePhone(profile.phone);
  const emergencyPhone = normalizePhone(profile.emergencyPhone);
  const birth = profile.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate) ? profile.birthDate : null;
  const street = profile.street?.trim() || profile.address?.trim() || null;
  const streetNumber = profile.streetNumber?.trim() || null;
  const neighborhood = profile.neighborhood?.trim() || null;
  const source = await sourceId(profile.referralSource);
  const referred = profile.referralSource === "other" ? profile.referralSourceOther || null : profile.referralSource || null;
  const preference = profile.contactPreference || "";
  const locationId = await defaultLocationId(market || profile.country);
  let patientId = await findPatient(email);
  if (!patientId) {
    const code = await query<{ code: string }>(
      `SELECT 'TF-' || lpad(nextval('patient_code_seq')::text, 5, '0') AS code`
    );
    const inserted = await query<{ id: string }>(
      `INSERT INTO patients (
         client_code, first_name, middle_name, paternal_surname, maternal_surname, last_name, sex, sex_detail, birth_date, preferred_language, marketing_source_id,
         referred_by_name, email_enc, email_hash, mobile_enc, mobile_hash, street, street_number, neighborhood, city, state, postal_code, country,
         emergency_name_enc, emergency_phone_enc, emergency_relation,
         consent_email, consent_phone, consent_sms, privacy_policy_status, location_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,true,$27,$28,'aceptado',$29)
       RETURNING id`,
      [
        code.rows[0].code,
        names.first,
        names.middle,
        names.paternal,
        names.maternal,
        names.last,
        sex,
        sex === "otro" ? profile.sexDetail?.trim() || null : null,
        birth,
        profile.locale === "en" ? "en" : "es",
        source,
        referred,
        encryptPhi(email),
        contactHash("email", email),
        encryptPhi(phone),
        contactHash("phone", phone),
        street,
        streetNumber,
        neighborhood,
        profile.city?.trim() || null,
        profile.state?.trim() || null,
        profile.postalCode?.trim() || null,
        profile.country?.trim() || null,
        encryptPhi(profile.emergencyName?.trim() || null),
        encryptPhi(emergencyPhone),
        profile.emergencyRelation?.trim() || null,
        preference === "call",
        preference === "whatsapp",
        locationId,
      ]
    );
    patientId = inserted.rows[0].id;
  } else {
    await query(
      `UPDATE patients SET
         first_name = $2,
         middle_name = $3,
         paternal_surname = $4,
         maternal_surname = $5,
         last_name = $6,
         sex = COALESCE($7, sex),
         sex_detail = CASE WHEN $7 = 'otro' THEN $8 ELSE sex_detail END,
         birth_date = COALESCE($9, birth_date),
         marketing_source_id = COALESCE($10, marketing_source_id),
         referred_by_name = COALESCE($11, referred_by_name),
         mobile_enc = COALESCE($12, mobile_enc),
         mobile_hash = COALESCE($13, mobile_hash),
         street = COALESCE($14, street),
         street_number = COALESCE($15, street_number),
         neighborhood = COALESCE($16, neighborhood),
         city = COALESCE($17, city),
         state = COALESCE($18, state),
         postal_code = COALESCE($19, postal_code),
         country = COALESCE($20, country),
         location_id = COALESCE(location_id, $24),
         emergency_name_enc = COALESCE($21, emergency_name_enc),
         emergency_phone_enc = COALESCE($22, emergency_phone_enc),
         emergency_relation = COALESCE($23, emergency_relation),
         consent_email = true,
         privacy_policy_status = 'aceptado',
         updated_at = now()
       WHERE id = $1`,
      [
        patientId,
        names.first,
        names.middle,
        names.paternal,
        names.maternal,
        names.last,
        sex,
        profile.sexDetail?.trim() || null,
        birth,
        source,
        referred,
        encryptPhi(phone),
        contactHash("phone", phone),
        street,
        streetNumber,
        neighborhood,
        profile.city?.trim() || null,
        profile.state?.trim() || null,
        profile.postalCode?.trim() || null,
        profile.country?.trim() || null,
        encryptPhi(profile.emergencyName?.trim() || null),
        encryptPhi(emergencyPhone),
        profile.emergencyRelation?.trim() || null,
        locationId,
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
  market?: "MX" | "US" | null;
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
    ? await saveProfile(email, input.profile || {}, input.market)
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
