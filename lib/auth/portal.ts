import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { contactHash, decryptPhi, encryptPhi, normalizeEmail } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";

const COOKIE = "thrive_portal_session";
const ABSOLUTE_SEC = 60 * 60 * 8;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPortalAccount(patientId: string, email: string, password: string) {
  const normalized = normalizeEmail(email);
  if (!normalized || password.length < 10) throw new DomainError("Email y contraseña de al menos 10 caracteres.");
  const hash = await hashPassword(password);
  await query(
    `INSERT INTO patient_portal_accounts (patient_id, email_hash, email_enc, password_hash)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (patient_id) DO UPDATE SET email_hash = EXCLUDED.email_hash, email_enc = EXCLUDED.email_enc, password_hash = EXCLUDED.password_hash, is_active = true`,
    [patientId, contactHash("email", normalized), encryptPhi(normalized), hash]
  );
}

export async function portalLogin(email: string, password: string, meta?: { ip?: string | null; userAgent?: string | null }) {
  const row = await query<{ id: string; patient_id: string; password_hash: string; is_active: boolean }>(
    `SELECT id, patient_id, password_hash, is_active FROM patient_portal_accounts WHERE email_hash = $1`,
    [contactHash("email", email)]
  );
  const account = row.rows[0];
  if (!account || !account.is_active || !(await verifyPassword(password, account.password_hash))) {
    throw new DomainError("Correo o contraseña incorrectos.", 401);
  }
  const token = randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO patient_portal_sessions (account_id, token_hash, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4,$5)`,
    [account.id, hashToken(token), new Date(Date.now() + ABSOLUTE_SEC * 1000).toISOString(), meta?.ip ?? null, meta?.userAgent ?? null]
  );
  await query(`UPDATE patient_portal_accounts SET last_login_at = now() WHERE id = $1`, [account.id]);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_SEC,
  });
  return { patientId: account.patient_id };
}

export async function getPortalSession() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const row = await query<{
      patient_id: string;
      first_name: string;
      last_name: string;
      expires_at: string;
      revoked_at: string | null;
      session_id: string;
    }>(
      `SELECT s.id AS session_id, s.expires_at, s.revoked_at, a.patient_id, p.first_name, p.last_name
       FROM patient_portal_sessions s
       JOIN patient_portal_accounts a ON a.id = s.account_id
       JOIN patients p ON p.id = a.patient_id
       WHERE s.token_hash = $1 AND a.is_active`,
      [hashToken(token)]
    );
    const session = row.rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) return null;
    await query(`UPDATE patient_portal_sessions SET last_seen_at = now() WHERE id = $1`, [session.session_id]);
    return { patientId: session.patient_id, firstName: session.first_name, lastName: session.last_name };
  } catch {
    return null;
  }
}

export async function clearPortalSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await query(`UPDATE patient_portal_sessions SET revoked_at = now() WHERE token_hash = $1`, [hashToken(token)]);
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function portalAppointments(patientId: string) {
  const rows = await query(
    `SELECT a.id, a.starts_at, a.ends_at, a.status, a.manage_token_hash, s.name AS service_name, l.name AS location_name,
            u.first_name, u.last_name
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN locations l ON l.id = a.location_id
     LEFT JOIN staff_users u ON u.id = a.staff_user_id
     WHERE a.patient_id = $1 ORDER BY a.starts_at DESC LIMIT 50`,
    [patientId]
  );
  return rows.rows.map((row) => ({ ...row, manage_token_hash: undefined }));
}

export async function portalInvoices(patientId: string) {
  const rows = await query(
    `SELECT id, invoice_number, issued_at, status, total, paid_total, billing_snapshot
     FROM invoices WHERE patient_id = $1 ORDER BY issued_at DESC`,
    [patientId]
  );
  return rows.rows;
}

export { decryptPhi };
