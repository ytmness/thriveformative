import { assignmentByToken, submitForm } from "@/lib/domain/forms";
import { readJson, requestMeta, toErrorResponse, DomainError } from "@/lib/http";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const assignment = await assignmentByToken(decodeURIComponent(token));
  if (!assignment) return Response.json({ error: "Formulario no encontrado." }, { status: 404 });
  return Response.json({
    id: assignment.id,
    status: assignment.status,
    name: assignment.name,
    schema: assignment.schema,
    requiresSignature: assignment.requires_signature,
    formType: assignment.form_type,
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const body = await readJson(req);
    await submitForm(decodeURIComponent(token), body.answers, (body.signature as string) || null, (body.signerName as string) || null, requestMeta(req));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof DomainError) return toErrorResponse(error);
    return toErrorResponse(error);
  }
}
