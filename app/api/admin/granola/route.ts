import { isSession, requirePermission } from "@/lib/auth/guard";
import { assignGranolaNote, listGranolaInbox } from "@/lib/domain/granolaInbox";
import { granolaConfigured, getGranolaNote, listGranolaNotes } from "@/lib/granola/client";
import { createNote, saveSession } from "@/lib/domain/patients";
import { readJson, toErrorResponse, DomainError } from "@/lib/http";

export async function GET(req: Request) {
  const session = await requirePermission("clinical.read");
  if (!isSession(session)) return session;
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "status";
  try {
    if (view === "inbox") return Response.json({ configured: granolaConfigured(), rows: await listGranolaInbox(true) });
    if (view === "notes") {
      const listed = await listGranolaNotes(30);
      return Response.json(listed);
    }
    return Response.json({ configured: granolaConfigured() });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("clinical.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    const action = String(body.action || "import");
    if (action === "assign") {
      return Response.json(await assignGranolaNote(String(body.inboxId || ""), String(body.patientId || ""), String(body.folderKey || "plan90"), session));
    }
    const granolaNoteId = String(body.granolaNoteId || "");
    const patientId = String(body.patientId || "");
    if (!granolaNoteId || !patientId) throw new DomainError("Faltan la nota o el paciente.");
    const fetched = await getGranolaNote(granolaNoteId);
    if (!fetched.configured) throw new DomainError("Conecta Granola en Configuración.", 503);
    if (!fetched.note) throw new DomainError("No se encontró la nota de Granola.", 404);
    const folderKey = String(body.folderKey || "plan90");
    if (folderKey === "sesiones") {
      await saveSession(patientId, {
        title: fetched.note.title,
        sessionDate: fetched.note.createdAt ? fetched.note.createdAt.slice(0, 10) : null,
        notes: fetched.note.body,
      }, session);
    } else {
      await createNote(patientId, {
        title: fetched.note.title,
        body: fetched.note.body,
        noteType: "free",
        folderKey,
      }, session);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
