"use client";

import { formatLocalDateTime } from "@/lib/scheduling/time";

export type CommunicationRow = {
  id: string;
  channel?: string | null;
  subject?: string | null;
  body?: string | null;
  status?: string | null;
  scheduled_for?: string | null;
  sent_at?: string | null;
  error?: string | null;
  provider?: string | null;
  template_key?: string | null;
  timezone?: string | null;
};

const CHANNEL_LABEL: Record<string, { es: string; en: string }> = {
  sms: { es: "SMS", en: "SMS" },
  whatsapp: { es: "WhatsApp", en: "WhatsApp" },
  imessage: { es: "iMessage", en: "iMessage" },
  email: { es: "Email", en: "Email" },
};

const STATUS_LABEL: Record<string, { es: string; en: string; chip: string }> = {
  sent: { es: "Enviado", en: "Sent", chip: "sent" },
  skipped: { es: "Omitido", en: "Skipped", chip: "skipped" },
  failed: { es: "Falló", en: "Failed", chip: "failed" },
  queued: { es: "En cola", en: "Queued", chip: "queued" },
};

function channelLabel(channel: string | null | undefined, english: boolean) {
  const key = String(channel || "").toLowerCase();
  const found = CHANNEL_LABEL[key];
  if (found) return english ? found.en : found.es;
  return channel ? String(channel) : english ? "Unknown" : "Sin canal";
}

function statusMeta(status: string | null | undefined, english: boolean) {
  const key = String(status || "").toLowerCase();
  const found = STATUS_LABEL[key];
  if (found) return { label: english ? found.en : found.es, chip: found.chip };
  if (!status) return { label: english ? "Unknown" : "Sin estado", chip: "queued" };
  return { label: String(status), chip: "queued" };
}

function messageTitle(row: CommunicationRow, english: boolean) {
  const subject = String(row.subject || "").trim();
  if (subject) return subject;
  const key = String(row.template_key || "").trim();
  if (key === "recordatorio") return english ? "Appointment reminder" : "Recordatorio de cita";
  if (key === "confirmacion") return english ? "Appointment confirmation" : "Confirmación de cita";
  if (key === "cancelacion") return english ? "Cancellation" : "Cancelación";
  if (key) return key.replace(/_/g, " ");
  const preview = String(row.body || "").replace(/<[^>]*>/g, "").trim();
  if (preview) return preview.length > 80 ? `${preview.slice(0, 80)}…` : preview;
  return english ? "Message" : "Mensaje";
}

function skipReason(error: string | null | undefined, english: boolean) {
  const raw = String(error || "").trim();
  if (!raw) return english ? "No reason recorded" : "Sin motivo registrado";
  if (raw === "sin destinatario") return english ? "No recipient" : "Sin destinatario";
  if (raw === "Twilio no configurado") return english ? "Provider not configured" : "Proveedor no configurado";
  if (raw.toLowerCase().includes("proveedor no configurado")) {
    return english ? "Skipped: provider not configured" : "Omitido: proveedor no configurado";
  }
  return raw;
}

export function CommunicationsList({
  rows,
  english = false,
}: {
  rows: CommunicationRow[];
  english?: boolean;
}) {
  if (!rows.length) {
    return (
      <div className="admin-table-wrap">
        <div className="admin-table__empty">{english ? "No messages." : "Sin comunicaciones."}</div>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap comm-list">
      {rows.map((row) => {
        const status = statusMeta(row.status, english);
        const when = formatLocalDateTime(
          row.sent_at || row.scheduled_for,
          row.timezone || "America/Chicago",
          english ? "en-US" : "es-MX"
        );
        const skipped = String(row.status || "").toLowerCase() === "skipped";
        const failed = String(row.status || "").toLowerCase() === "failed";
        return (
          <div key={String(row.id)} className="admin-table__row comm-row">
            <div className="comm-row__main">
              <div className="admin-table__cell-title">{messageTitle(row, english)}</div>
              <div className="admin-table__cell-sub">
                <span className="comm-channel">{channelLabel(row.channel, english)}</span>
                {when ? <span> · {when}</span> : null}
              </div>
              {skipped ? (
                <p className="comm-reason">
                  {english ? "Why it was skipped: " : "Por qué se omitió: "}
                  {skipReason(row.error, english)}
                </p>
              ) : null}
              {failed && row.error ? (
                <p className="comm-reason">{row.error}</p>
              ) : null}
            </div>
            <span className={`comm-chip comm-chip--${status.chip}`}>{status.label}</span>
          </div>
        );
      })}
    </div>
  );
}
