import { isSession, requirePermission } from "@/lib/auth/guard";
import { DomainError, readJson, toErrorResponse } from "@/lib/http";
import { SquareApiError } from "@/lib/square/client";
import { SquareConfigError } from "@/lib/square/config";
import { selectTerminalDevice, startTerminalPairing, terminalLinkStatus } from "@/lib/square/terminal";

function squareError(error: unknown) {
  if (error instanceof SquareConfigError) return new DomainError(error.message, 503);
  if (error instanceof SquareApiError) {
    const status = error.status >= 400 && error.status < 500 ? error.status : 502;
    return new DomainError(error.message, status);
  }
  return error;
}

export async function GET() {
  const session = await requirePermission("sales.read");
  if (!isSession(session)) return session;
  try {
    return Response.json(await terminalLinkStatus());
  } catch (error) {
    return toErrorResponse(squareError(error));
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("sales.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.action === "code") {
      return Response.json(await startTerminalPairing(String(body.name || "Recepción")));
    }
    if (body.action === "select") {
      return Response.json({ device: await selectTerminalDevice(String(body.deviceId || "")) });
    }
    throw new DomainError("Acción de terminal no válida.");
  } catch (error) {
    return toErrorResponse(squareError(error));
  }
}
