import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export const STAFF_COOKIE = "thrive_staff_session";
const ABSOLUTE_SEC = 60 * 60 * 12;
const IDLE_MS = 45 * 60 * 1000;

export type StaffProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  calendarColor: string;
  isBookable: boolean;
  roles: string[];
};

export type StaffSession = {
  sessionId: string;
  staff: StaffProfile;
  permissions: string[];
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createStaffSession(
  staffUserId: string,
  meta?: { ip?: string | null; userAgent?: string | null }
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + ABSOLUTE_SEC * 1000);
  await query(
    `INSERT INTO staff_sessions (staff_user_id, token_hash, ip, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [staffUserId, hashToken(token), meta?.ip ?? null, meta?.userAgent ?? null, expires.toISOString()]
  );
  await query(`UPDATE staff_users SET last_login_at = now() WHERE id = $1`, [staffUserId]);
  const jar = await cookies();
  jar.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_SEC,
  });
}

export async function clearStaffSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (token) {
    await query(`UPDATE staff_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [
      hashToken(token),
    ]);
  }
  jar.set(STAFF_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(STAFF_COOKIE)?.value;
    if (!token) return null;
    const res = await query<{
      session_id: string;
      staff_user_id: string;
      expires_at: string;
      last_seen_at: string;
      revoked_at: string | null;
      email: string;
      first_name: string;
      last_name: string;
      job_title: string | null;
      calendar_color: string;
      is_bookable: boolean;
      is_active: boolean;
    }>(
      `SELECT s.id AS session_id, s.staff_user_id, s.expires_at, s.last_seen_at, s.revoked_at,
              u.email, u.first_name, u.last_name, u.job_title, u.calendar_color, u.is_bookable, u.is_active
       FROM staff_sessions s
       JOIN staff_users u ON u.id = s.staff_user_id
       WHERE s.token_hash = $1`,
      [hashToken(token)]
    );
    const row = res.rows[0];
    if (!row || row.revoked_at || !row.is_active) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    if (Date.now() - new Date(row.last_seen_at).getTime() > IDLE_MS) {
      await query(`UPDATE staff_sessions SET revoked_at = now() WHERE id = $1`, [row.session_id]);
      return null;
    }
    await query(`UPDATE staff_sessions SET last_seen_at = now() WHERE id = $1`, [row.session_id]);
    const [perms, roles] = await Promise.all([
      query<{ key: string }>(
        `SELECT DISTINCT p.key
         FROM staff_user_roles sur
         JOIN role_permissions rp ON rp.role_id = sur.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE sur.staff_user_id = $1`,
        [row.staff_user_id]
      ),
      query<{ key: string }>(
        `SELECT r.key FROM staff_user_roles sur JOIN roles r ON r.id = sur.role_id WHERE sur.staff_user_id = $1`,
        [row.staff_user_id]
      ),
    ]);
    return {
      sessionId: row.session_id,
      permissions: perms.rows.map((p) => p.key),
      staff: {
        id: row.staff_user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        jobTitle: row.job_title,
        calendarColor: row.calendar_color,
        isBookable: row.is_bookable,
        roles: roles.rows.map((r) => r.key),
      },
    };
  } catch {
    return null;
  }
}

export function hasPermission(session: StaffSession, key: string): boolean {
  return session.permissions.includes(key);
}
