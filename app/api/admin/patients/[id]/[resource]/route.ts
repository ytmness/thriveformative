import { isSession, requirePermission } from "@/lib/auth/guard";
import { listPatientForms } from "@/lib/domain/forms";
import { addSensitive, createNote, deleteNote, deleteSession, listNotes, listSensitive, listSessions, lockNote, removeSensitive, saveSession, type SensitiveKind } from "@/lib/domain/patients";
import { createDocumentFolder, listDocumentFolders } from "@/lib/domain/chartFolders";
import { listAppointments } from "@/lib/domain/appointments";
import { query } from "@/lib/db";
import { deletePrivateFile, privateFileExists, savePrivateFile } from "@/lib/files/privateStore";
import { readJson, requestMeta, toErrorResponse, DomainError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

const KINDS = new Set(["allergies", "conditions", "medications", "supplements"]);
const STUDY_KINDS = new Set(["imaging", "labs", "microbiota", "procedures"]);
const DOC_KINDS = new Set(["imaging", "labs", "microbiota", "procedures", "composicion", "nutricionales", "document"]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string; resource: string }> }) {
  const { id, resource } = await ctx.params;
  const clinical = KINDS.has(resource) || resource === "notes" || resource === "sessions" || resource === "forms" || resource === "documents" || resource === "document-folders";
  const session = await requirePermission(clinical ? "clinical.read" : "patients.read");
  if (!isSession(session)) return session;
  const meta = requestMeta(req);
  try {
    if (KINDS.has(resource)) return Response.json({ rows: await listSensitive(id, resource as SensitiveKind, session, meta) });
    if (resource === "notes") {
      const folder = new URL(req.url).searchParams.get("folder") || "plan90";
      return Response.json({ rows: await listNotes(id, session, meta, folder) });
    }
    if (resource === "document-folders") {
      const parent = new URL(req.url).searchParams.get("parent") || "estudios";
      return Response.json({ rows: await listDocumentFolders(id, parent) });
    }
    if (resource === "sessions") return Response.json({ rows: await listSessions(id, session, meta) });
    if (resource === "forms") return Response.json({ rows: await listPatientForms(id, session) });
    if (resource === "appointments") {
      const from = new Date(Date.now() - 365 * 86400000).toISOString();
      const to = new Date(Date.now() + 365 * 86400000).toISOString();
      return Response.json({ rows: await listAppointments(from, to, { patientId: id }) });
    }
    if (resource === "documents") {
      const rows = await query<{ id: string; title: string; mime_type: string | null; size_bytes: number | null; is_photo: boolean; kind: string | null; taken_at: string | null; created_at: string; storage_path: string; folder_id: string | null; document_date: string | null; folder_name: string | null; folder_slug: string | null }>(
        `SELECT d.id, d.title, d.mime_type, d.size_bytes, d.is_photo, d.kind, d.taken_at, d.created_at, d.storage_path,
                d.folder_id, d.document_date::text AS document_date, f.name AS folder_name, f.slug AS folder_slug
         FROM patient_documents d
         LEFT JOIN patient_document_folders f ON f.id = d.folder_id
         WHERE d.patient_id = $1
         ORDER BY coalesce(d.document_date, d.created_at::date) DESC, d.created_at DESC`,
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
      const { locationTimezone } = await import("@/lib/scheduling/time");
      const rows = await query<{
        id: string;
        channel: string;
        subject: string | null;
        body: string;
        status: string;
        scheduled_for: string;
        sent_at: string | null;
        error: string | null;
        provider: string | null;
        template_key: string | null;
        timezone: string | null;
        country: string | null;
      }>(
        `SELECT m.id, m.channel, m.subject, m.body, m.status, m.scheduled_for, m.sent_at, m.error, m.provider,
                t.template_key,
                coalesce(al.timezone, pl.timezone) AS timezone,
                coalesce(al.country, pl.country, p.country) AS country
         FROM messages m
         LEFT JOIN message_templates t ON t.id = m.template_id
         LEFT JOIN patients p ON p.id = m.patient_id
         LEFT JOIN locations pl ON pl.id = p.location_id
         LEFT JOIN appointments a ON a.id = m.appointment_id
         LEFT JOIN locations al ON al.id = a.location_id
         WHERE m.patient_id = $1
         ORDER BY m.created_at DESC
         LIMIT 100`,
        [id]
      );
      return Response.json({
        rows: rows.rows.map((row) => ({
          ...row,
          timezone: locationTimezone(row.timezone, row.country),
        })),
      });
    }
    if (resource === "sales") {
      const rows = await query(`SELECT id, sale_number, status, total, paid_total, balance, created_at FROM sales WHERE patient_id = $1 ORDER BY created_at DESC`, [id]);
      return Response.json({ rows: rows.rows });
    }
    if (resource === "memberships") {
      const { listPatientMembershipDetails } = await import("@/lib/domain/memberships");
      return Response.json({ rows: await listPatientMembershipDetails(id) });
    }
    throw new DomainError("Recurso no encontrado.", 404);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string; resource: string }> }) {
  const { id, resource } = await ctx.params;
  const perm = resource === "notes" || resource === "sessions" || resource === "document-folders" || KINDS.has(resource) ? "clinical.write" : "patients.write";
  const session = await requirePermission(perm);
  if (!isSession(session)) return session;
  try {
    if (KINDS.has(resource)) {
      const body = await readJson(req);
      return Response.json(await addSensitive(id, resource as SensitiveKind, String(body.value || ""), {
        severity: body.severity ? String(body.severity) : null,
        dose: body.dose ? String(body.dose) : null,
        frequency: body.frequency ? String(body.frequency) : null,
        sinceDate: body.sinceDate ? String(body.sinceDate) : null,
        notes: body.notes ? String(body.notes) : null,
      }, session));
    }
    if (resource === "document-folders") {
      const body = await readJson(req);
      return Response.json(await createDocumentFolder(id, String(body.parentKey || "estudios"), String(body.name || "")));
    }
    if (resource === "notes") {
      const body = await readJson(req);
      return Response.json(await createNote(id, body as never, session));
    }
    if (resource === "sessions") {
      const body = await readJson(req);
      return Response.json(await saveSession(id, {
        id: body.id ? String(body.id) : null,
        title: String(body.title || ""),
        sessionDate: body.sessionDate ? String(body.sessionDate) : null,
        notes: body.notes ? String(body.notes) : null,
        durationSeconds: Number(body.durationSeconds || 0),
        startTimer: body.startTimer === true,
      }, session));
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
      if (file.size > 32 * 1024 * 1024) throw new DomainError("El archivo supera 32 MB.");
      const kind = String(form.get("kind") || "document");
      const filename = file.name.toLowerCase();
      const studyFile = file.type === "application/pdf" || filename.endsWith(".pdf")
        || file.type === "image/jpeg" || filename.endsWith(".jpg") || filename.endsWith(".jpeg")
        || file.type === "image/png" || filename.endsWith(".png");
      const binaryOk = STUDY_KINDS.has(kind) || kind === "composicion" || kind === "nutricionales";
      if (binaryOk && !studyFile) throw new DomainError("Esta carpeta acepta PDF, JPG y PNG.");
      const buffer = Buffer.from(await file.arrayBuffer());
      const storage = await savePrivateFile(id, file.name, buffer);
      const isPhoto = !binaryOk && (file.type.startsWith("image/") || form.get("isPhoto") === "1");
      const storedKind = DOC_KINDS.has(kind) ? kind : "document";
      const folderId = String(form.get("folderId") || "").trim() || null;
      const documentDate = String(form.get("documentDate") || "").trim() || null;
      const title = String(form.get("title") || file.name).trim();
      const inserted = await query<{ id: string }>(
        `INSERT INTO patient_documents (patient_id, title, storage_path, mime_type, size_bytes, is_photo, kind, uploaded_by, folder_id, document_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [id, title, storage, file.type, file.size, isPhoto, storedKind, session.staff.id, folderId, documentDate]
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
  const session = await requirePermission(KINDS.has(resource) || resource === "notes" || resource === "sessions" ? "clinical.write" : "patients.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    const rowId = String(body.id || "");
    if (KINDS.has(resource)) {
      await removeSensitive(id, resource as "allergies", rowId, session);
      return Response.json({ ok: true });
    }
    if (resource === "notes") {
      await deleteNote(id, rowId, session);
      return Response.json({ ok: true });
    }
    if (resource === "sessions") {
      await deleteSession(id, rowId, session);
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
