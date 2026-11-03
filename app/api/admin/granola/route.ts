import { isSession, requirePermission } from "@/lib/auth/guard";
import {
  assignGranolaNote,
  importGranolaNoteToPatient,
  listGranolaInbox,
  reprocessUnassignedGranolaNotes,
  retryGranolaAutoAssign,
  type GranolaInclude,
} from "@/lib/domain/granolaInbox";
import { granolaConfigured, listGranolaNotes } from "@/lib/granola/client";
import { getSiteUrl } from "@/lib/env/server";
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
    if (view === "inbox") {
      const retry = url.searchParams.get("retry") === "1";
      const reprocess = retry ? await reprocessUnassignedGranolaNotes() : null;
      return Response.json({
        configured: granolaConfigured(),
        rows: await listGranolaInbox(true),
        reprocess,
      });
    }
    if (view === "notes") {
      const listed = await listGranolaNotes(30);
      return Response.json(listed);
    }
    return Response.json({
      configured: granolaConfigured(),
      webhookUrl: `${getSiteUrl().replace(/\/$/, "")}/api/webhooks/granola`,
    });
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
      const sessionNumberRaw = body.sessionNumber ?? body.session;
      const sessionNumber =
        sessionNumberRaw === "" || sessionNumberRaw == null ? null : Number(sessionNumberRaw);
      return Response.json(
        await assignGranolaNote(
          String(body.inboxId || ""),
          String(body.patientId || ""),
          String(body.folderKey || "plan90"),
          session,
          include,
          Number.isFinite(sessionNumber) ? sessionNumber : null
        )
      );
    }
    if (action === "retry") {
      const inboxId = String(body.inboxId || "");
      if (inboxId) return Response.json(await retryGranolaAutoAssign(inboxId));
      return Response.json(await reprocessUnassignedGranolaNotes());
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
