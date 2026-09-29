import { isSession, requirePermission } from "@/lib/auth/guard";
import { writeAudit } from "@/lib/audit";
import { query } from "@/lib/db";
import { readPrivateFile } from "@/lib/files/privateStore";
import { toErrorResponse, DomainError } from "@/lib/http";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("clinical.read");
  if (!isSession(session)) return session;
  try {
    const { id } = await ctx.params;
    const row = await query<{ storage_path: string; mime_type: string | null; title: string; patient_id: string }>(
      `SELECT storage_path, mime_type, title, patient_id FROM patient_documents WHERE id = $1`,
      [id]
    );
    if (!row.rows[0]) throw new DomainError("Documento no encontrado.", 404);
    const data = await readPrivateFile(row.rows[0].storage_path);
    await writeAudit({
      actorType: "staff",
      actorId: session.staff.id,
      action: "documents.download",
      entityType: "document",
      entityId: id,
      patientId: row.rows[0].patient_id,
    });
    return new Response(data, {
      headers: {
        "Content-Type": row.rows[0].mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${row.rows[0].title.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
