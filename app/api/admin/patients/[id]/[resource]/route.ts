import { isSession, requirePermission } from "@/lib/auth/guard";
import { listPatientForms } from "@/lib/domain/forms";
import { addSensitive, createNote, listNotes, listSensitive, lockNote, removeSensitive } from "@/lib/domain/patients";
import { listAppointments } from "@/lib/domain/appointments";
import { query } from "@/lib/db";
import { deletePrivateFile, privateFileExists, savePrivateFile } from "@/lib/files/privateStore";
import { readJson, requestMeta, toErrorResponse, DomainError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

const KINDS = new Set(["allergies", "conditions", "medications"]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string; resource: string }> }) {
  const { id, resource } = await ctx.params;
  const clinical = KINDS.has(resource) || resource === "notes" || resource === "forms" || resource === "documents";
  const session = await requirePermission(clinical ? "clinical.read" : "patients.read");
  if (!isSession(session)) return session;
  const meta = requestMeta(req);
  try {
    if (KINDS.has(resource)) return Response.json({ rows: await listSensitive(id, resource as "allergies", session, meta) });
    if (resource === "notes") return Response.json({ rows: await listNotes(id, session, meta) });
    if (resource === "forms") return Response.json({ rows: await listPatientForms(id, session) });
    if (resource === "appointments") {
      const from = new Date(Date.now() - 365 * 86400000).toISOString();
      const to = new Date(Date.now() + 365 * 86400000).toISOString();
      return Response.json({ rows: await listAppointments(from, to, { patientId: id }) });
    }
    if (resource === "documents") {
      const rows = await query<{ id: string; title: string; mime_type: string | null; size_bytes: number | null; is_photo: boolean; taken_at: string | null; created_at: string; storage_path: string }>(
        `SELECT id, title, mime_type, size_bytes, is_photo, taken_at, created_at, storage_path FROM patient_documents WHERE patient_id = $1 ORDER BY created_at DESC`,
        [id]
      );
      await writeAudit({ actorType: "staff", actorId: session.staff.id, action: "documents.view", entityType: "patient", entityId: id, patientId: id, ip: meta.ip, userAgent: meta.userAgent });
      const listed = await Promise.all(rows.rows.map(async (row) => {
        const { storage_path: storagePath, ...rest } = row;
        return { ...rest, missing: !(await privateFileExists(storagePath)) };
      }));
      return Response.json({ rows: listed });
    }
    if (resource === "messages") {
      const rows = await query(
        `SELECT id, channel, subject, body, status, scheduled_for, sent_at, error FROM messages WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [id]
      );
      return Response.json({ rows: rows.rows });
    }
    if (resource === "sales") {
      const rows = await query(`SELECT id, sale_number, status, total, paid_total, balance, created_at FROM sales WHERE patient_id = $1 ORDER BY created_at DESC`, [id]);
      return Response.json({ rows: rows.rows });
    }
    if (resource === "memberships") {
      const rows = await query(
        `SELECT pm.id, pm.status, pm.current_period_end, m.name
         FROM patient_memberships pm JOIN memberships m ON m.id = pm.membership_id
         WHERE pm.patient_id = $1 ORDER BY pm.created_at DESC`,
        [id]
      );
      return Response.json({ rows: rows.rows });
    }
    throw new DomainError("Recurso no encontrado.", 404);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string; resource: string }> }) {
  const { id, resource } = await ctx.params;
  const perm = resource === "notes" || KINDS.has(resource) ? "clinical.write" : resource === "documents" ? "patients.write" : "patients.write";
  const session = await requirePermission(perm);
  if (!isSession(session)) return session;
  try {
    if (KINDS.has(resource)) {
      const body = await readJson(req);
      return Response.json(await addSensitive(id, resource as "allergies", String(body.value || ""), (body.severity as string) || null, session));
    }
    if (resource === "notes") {
      const body = await readJson(req);
      return Response.json(await createNote(id, body as never, session));
    }
    if (resource === "notes-lock") {
      const body = await readJson(req);
      await lockNote(String(body.id || ""), session);
      return Response.json({ ok: true });
    }
    if (resource === "documents") {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new DomainError("Adjunta un archivo.");
      if (file.size > 15 * 1024 * 1024) throw new DomainError("El archivo supera 15 MB.");
      const buffer = Buffer.from(await file.arrayBuffer());
      const storage = await savePrivateFile(id, file.name, buffer);
      const isPhoto = file.type.startsWith("image/") || form.get("isPhoto") === "1";
      const inserted = await query<{ id: string }>(
        `INSERT INTO patient_documents (patient_id, title, storage_path, mime_type, size_bytes, is_photo, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [id, String(form.get("title") || file.name), storage, file.type, file.size, isPhoto, session.staff.id]
      );
      await writeAudit({ actorType: "staff", actorId: session.staff.id, action: "documents.upload", entityType: "document", entityId: inserted.rows[0].id, patientId: id });
      return Response.json({ id: inserted.rows[0].id });
    }
    throw new DomainError("Recurso no encontrado.", 404);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string; resource: string }> }) {
  const { id, resource } = await ctx.params;
  const session = await requirePermission(KINDS.has(resource) ? "clinical.write" : "patients.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    const rowId = String(body.id || "");
    if (KINDS.has(resource)) {
      await removeSensitive(id, resource as "allergies", rowId, session);
      return Response.json({ ok: true });
    }
    if (resource === "documents") {
      const row = await query<{ storage_path: string }>(
        `SELECT storage_path FROM patient_documents WHERE id = $1 AND patient_id = $2`,
        [rowId, id]
      );
      if (!row.rows[0]) throw new DomainError("Documento no encontrado.", 404);
      await query(`DELETE FROM patient_documents WHERE id = $1 AND patient_id = $2`, [rowId, id]);
      await deletePrivateFile(row.rows[0].storage_path);
      await writeAudit({ actorType: "staff", actorId: session.staff.id, action: "documents.delete", entityType: "document", entityId: rowId, patientId: id });
      return Response.json({ ok: true });
    }
    throw new DomainError("Recurso no encontrado.", 404);
  } catch (error) {
    return toErrorResponse(error);
  }
}
