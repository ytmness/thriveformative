import { query } from "@/lib/db";
import { log } from "@/lib/log";

export type AuditInput = {
  actorType: "staff" | "patient" | "system" | "api";
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  patientId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log
        (actor_type, actor_id, action, entity_type, entity_id, patient_id, ip, user_agent, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [
        input.actorType,
        input.actorId ?? null,
        input.action,
        input.entityType ?? null,
        input.entityId ?? null,
        input.patientId ?? null,
        input.ip ?? null,
        input.userAgent ?? null,
        JSON.stringify(input.metadata ?? {}),
      ]
    );
  } catch (error) {
    log.error("audit", "no se pudo escribir la bitácora", {
      action: input.action,
      code: error instanceof Error ? error.name : "error",
    });
  }
}
