import type { StaffSession } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { log } from "@/lib/log";

const USER_LIMIT = 40;
const TOOL_LIMIT = 20;

export async function assertAssistantQuota(session: StaffSession, role: "user" | "tool"): Promise<void> {
  const limit = role === "user" ? USER_LIMIT : TOOL_LIMIT;
  try {
    const res = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM assistant_messages
       WHERE staff_user_id = $1 AND role = $2 AND created_at > now() - interval '1 hour'`,
      [session.staff.id, role]
    );
    if ((res.rows[0]?.n || 0) >= limit) {
      throw new DomainError(
        role === "user"
          ? "Llegaste al límite de mensajes de esta hora. Inténtalo más tarde."
          : "Llegaste al límite de acciones de esta hora. Inténtalo más tarde.",
        429
      );
    }
  } catch (error) {
    if (error instanceof DomainError) throw error;
    log.error("assistant", "no se pudo revisar el límite", {
      code: error instanceof Error ? error.name : "error",
    });
  }
}

export async function logAssistant(
  session: StaffSession,
  role: "user" | "assistant" | "tool",
  content: string,
  toolName?: string | null
): Promise<void> {
  try {
    await query(
      `INSERT INTO assistant_messages (staff_user_id, role, content, tool_name)
       VALUES ($1, $2, $3, $4)`,
      [session.staff.id, role, content.slice(0, 4000), toolName || null]
    );
  } catch (error) {
    log.error("assistant", "no se pudo guardar el mensaje", {
      code: error instanceof Error ? error.name : "error",
    });
  }
}
