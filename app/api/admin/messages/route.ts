import { isSession, requirePermission } from "@/lib/auth/guard";
import { encryptPhi, decryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { dispatchDueMessages } from "@/lib/messaging/queue";
import { readJson, toErrorResponse, DomainError } from "@/lib/http";

export async function GET() {
  const session = await requirePermission("communications.read");
  if (!isSession(session)) return session;
  const rows = await query(
    `SELECT id, channel, subject, body, status, scheduled_for, sent_at, error, recipient_enc
     FROM messages ORDER BY created_at DESC LIMIT 200`
  );
  return Response.json({
    rows: rows.rows.map((row) => {
      let recipient = "—";
      try {
        recipient = decryptPhi(row.recipient_enc as string | null) || "—";
      } catch {
        recipient = "—";
      }
      return {
        id: row.id,
        channel: row.channel,
        subject: row.subject,
        body: row.body,
        status: row.status,
        scheduled_for: row.scheduled_for,
        sent_at: row.sent_at,
        error: row.error,
        recipient,
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await requirePermission("communications.write");
  if (!isSession(session)) return session;
  try {
    const body = await readJson(req);
    if (body.action === "dispatch") return Response.json(await dispatchDueMessages());
    const channel = body.channel === "sms" ? "sms" : "email";
    const recipient = String(body.recipient || "").trim();
    const text = String(body.body || "").trim();
    if (!recipient || !text) throw new DomainError("Destinatario y mensaje son obligatorios.");
    await query(
      `INSERT INTO messages (channel, recipient_enc, patient_id, subject, body, scheduled_for)
       VALUES ($1,$2,$3,$4,$5, now())`,
      [channel, encryptPhi(recipient), body.patientId || null, body.subject || null, text]
    );
    await dispatchDueMessages(20);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
