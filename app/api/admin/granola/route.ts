import { isSession, requirePermission } from "@/lib/auth/guard";
import {
  assignGranolaNote,
  importGranolaNoteToPatient,
  listGranolaInbox,
  type GranolaInclude,
} from "@/lib/domain/granolaInbox";
import { granolaConfigured, listGranolaNotes } from "@/lib/granola/client";
import { readJson, toErrorResponse, DomainError } from "@/lib/http";

function parseInclude(body: Record<string, unknown>): GranolaInclude {
  const include = body.include && typeof body.include === "object" ? (body.include as Record<string, unknown>) : body;
  return {
    summary: include.summary !== false && include.summary !== "false",
    notes: include.notes !== false && include.notes !== "false",
    transcript: include.transcript !== false && include.transcript !== "false",
  };
}

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
    const include = parseInclude(body);
    if (action === "assign") {
      return Response.json(
        await assignGranolaNote(
          String(body.inboxId || ""),
          String(body.patientId || ""),
          String(body.folderKey || "plan90"),
          session,
          include
        )
      );
    }
    const granolaNoteId = String(body.granolaNoteId || "");
    const patientId = String(body.patientId || "");
    if (!granolaNoteId || !patientId) throw new DomainError("Faltan la nota o el paciente.");
    return Response.json(
      await importGranolaNoteToPatient(
        granolaNoteId,
        patientId,
        String(body.folderKey || "plan90"),
        session,
        include
      )
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
