"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { api } from "@/components/admin/clinic/client";
import { useClinicScope } from "@/components/admin/clinic/ClinicScope";
import type { AssistantReply, ConfirmCard, ConfirmField, DisplayBlock } from "@/lib/assistant/types";

type Line = {
  role: "user" | "assistant";
  content: string;
  blocks?: DisplayBlock[];
  confirm?: ConfirmCard | null;
  settled?: "saved" | "dismissed";
};

const FIELD_TYPES = [
  ["heading", "Título"],
  ["text", "Texto corto"],
  ["textarea", "Párrafo"],
  ["date", "Fecha"],
  ["checkbox", "Casilla"],
  ["select", "Lista"],
  ["signature", "Firma"],
] as const;

function suggestions(pathname: string, permissions: string[], english: boolean): string[] {
  const items: string[] = [english ? "How do I do this on this screen?" : "¿Cómo hago esto en esta pantalla?"];
  if (pathname.includes("/formularios") && permissions.includes("forms.write")) items.unshift(english ? "Create a consent form with 3 fields" : "Créame un consentimiento con 3 campos");
  if (permissions.includes("dashboard.read")) items.push(english ? "How is today going?" : "¿Cómo va el día de hoy?");
  if (permissions.includes("reports.read")) items.push(english ? "Revenue for the last 30 days" : "Ingresos de los últimos 30 días");
  return items.slice(0, 3);
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(\/(?:admin|portal)[^)\s]*\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\((\/(?:admin|portal)[^)\s]*)\)$/);
        if (!link) return <span key={index}>{part}</span>;
        return <Link key={index} href={link[2]}>{link[1]}</Link>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: DisplayBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "metrics") {
          return (
            <div key={index} className="assistant-metrics">
              {block.items.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          );
        }
        if (block.kind === "links") {
          return (
            <div key={index} className="assistant-links">
              {block.items.map((item) => (
                <Link key={item.href} href={item.href} className="admin-btn">{item.label}</Link>
              ))}
            </div>
          );
        }
        return (
          <div key={index} className="assistant-table-wrap">
            {block.title ? <p>{block.title}</p> : null}
            <table>
              <thead>
                <tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

function ConfirmEditor({
  card,
  busy,
  onConfirm,
  onDismiss,
}: {
  card: ConfirmCard;
  busy: boolean;
  onConfirm: (args: Record<string, unknown>) => void;
  onDismiss: () => void;
}) {
  const [args, setArgs] = useState<Record<string, unknown>>(card.args);

  function set(key: string, value: unknown) {
    setArgs((current) => ({ ...current, [key]: value }));
  }

  const fields = Array.isArray(args.fields) ? args.fields as { label?: string; type?: string; required?: boolean; options?: string[] }[] : [];

  return (
    <form
      className="assistant-confirm"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(args);
      }}
    >
      <p className="assistant-confirm__title">{card.title}</p>
      <p>{card.summary}</p>
      {card.fields.map((field) => (
        <FieldEditor key={field.key} field={field} args={args} fields={fields} onChange={set} />
      ))}
      <div className="assistant-confirm__actions">
        <button type="button" className="admin-btn" disabled={busy} onClick={onDismiss}>Cancelar</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>{busy ? "Guardando…" : "Confirmar"}</button>
      </div>
    </form>
  );
}

function FieldEditor({
  field,
  args,
  fields,
  onChange,
}: {
  field: ConfirmField;
  args: Record<string, unknown>;
  fields: { label?: string; type?: string; required?: boolean; options?: string[] }[];
  onChange: (key: string, value: unknown) => void;
}) {
  if (field.input === "fields") {
    return (
      <div className="assistant-fields">
        <span>{field.label}</span>
        {fields.map((item, index) => (
          <div key={index} className="assistant-fields__row">
            <input
              aria-label={`Etiqueta ${index + 1}`}
              value={item.label || ""}
              onChange={(event) => onChange("fields", fields.map((row, i) => (i === index ? { ...row, label: event.target.value } : row)))}
            />
            <select
              aria-label={`Tipo ${index + 1}`}
              value={item.type || "text"}
              onChange={(event) => onChange("fields", fields.map((row, i) => (i === index ? { ...row, type: event.target.value } : row)))}
            >
              {FIELD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label>
              <input
                type="checkbox"
                checked={Boolean(item.required)}
                onChange={(event) => onChange("fields", fields.map((row, i) => (i === index ? { ...row, required: event.target.checked } : row)))}
              />
              Obligatorio
            </label>
            <button
              type="button"
              onClick={() => onChange("fields", fields.filter((_, i) => i !== index))}
              aria-label={`Quitar campo ${index + 1}`}
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
    );
  }
  const value = typeof args[field.key] === "string" ? String(args[field.key]) : "";
  if (field.input === "textarea") {
    return (
      <label className="admin-field">
        <span className="admin-field__label">{field.label}</span>
        <textarea value={value} onChange={(event) => onChange(field.key, event.target.value)} />
      </label>
    );
  }
  if (field.input === "select") {
    return (
      <label className="admin-field">
        <span className="admin-field__label">{field.label}</span>
        <select value={value} onChange={(event) => onChange(field.key, event.target.value)}>
          {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="admin-field">
      <span className="admin-field__label">{field.label}</span>
      <input
        type={field.input === "datetime" ? "datetime-local" : "text"}
        value={field.input === "datetime" ? value.slice(0, 16) : value}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
    </label>
  );
}

export function AssistantDock({ pathname, permissions }: { pathname: string; permissions: string[] }) {
  const scope = useClinicScope();
  const english = scope.country === "US";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prompts = suggestions(pathname, permissions, english);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines, busy, open]);

  async function ask(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...lines, { role: "user" as const, content }];
    setLines(next);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const reply = await api<AssistantReply>("/api/admin/assistant", {
        method: "POST",
        body: JSON.stringify({
          messages: next.map((line) => ({ role: line.role, content: line.content })),
          scope: { country: scope.country, locationId: scope.locationId || null },
          pathname,
        }),
      });
      setLines([...next, { role: "assistant", content: reply.message, blocks: reply.blocks, confirm: reply.confirm }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar al asistente.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(index: number, args: Record<string, unknown>) {
    const line = lines[index];
    if (!line?.confirm || busy) return;
    setBusy(true);
    setError(null);
    try {
      const reply = await api<AssistantReply>("/api/admin/assistant", {
        method: "POST",
        body: JSON.stringify({
          confirm: { tool: line.confirm.tool, args },
          scope: { country: scope.country, locationId: scope.locationId || null },
          pathname,
        }),
      });
      setLines((current) => [
        ...current.map((row, i) => (i === index ? { ...row, confirm: null, settled: "saved" as const } : row)),
        { role: "assistant", content: reply.message, blocks: reply.blocks },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <>
      <button type="button" className="admin-tutorial__btn" aria-expanded={open} onClick={() => setOpen(true)}>
        <Sparkles size={14} aria-hidden />
        {english ? "Assistant" : "Asistente"}
      </button>
      {open ? (
        <div className="admin-drawer assistant-drawer" onClick={() => setOpen(false)}>
          <div
            className="admin-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label={english ? "Panel assistant" : "Asistente del panel"}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-drawer__head">
              <div>
                <p className="assistant-kicker">Thrive Formative</p>
                <h2>{english ? "Assistant" : "Asistente"}</h2>
              </div>
              <button type="button" className="admin-icon-btn" aria-label={english ? "Close assistant" : "Cerrar asistente"} onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </header>
            <div className="assistant-log" ref={logRef}>
              <p className="assistant-note">{english ? "Questions can share patient data with the model provider. Turn on zero retention on that account." : "Las consultas pueden compartir datos de pacientes con el proveedor del modelo. Activa la retención cero en esa cuenta."}</p>
              {lines.length === 0 ? (
                <div className="assistant-prompts">
                  {prompts.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void ask(prompt)}>{prompt}</button>
                  ))}
                </div>
              ) : null}
              {lines.map((line, index) => (
                <article key={index} className={`assistant-bubble assistant-bubble--${line.role}`}>
                  <RichText text={line.content} />
                  {line.blocks?.length ? <Blocks blocks={line.blocks} /> : null}
                  {line.settled === "saved" ? <p className="assistant-settled">{english ? "Saved" : "Guardado"}</p> : null}
                  {line.settled === "dismissed" ? <p className="assistant-settled">{english ? "Cancelled" : "Cancelado"}</p> : null}
                  {line.confirm && !line.settled ? (
                    <ConfirmEditor
                      card={line.confirm}
                      busy={busy}
                      onConfirm={(args) => void confirm(index, args)}
                      onDismiss={() => setLines((current) => current.map((row, i) => (i === index ? { ...row, confirm: null, settled: "dismissed" } : row)))}
                    />
                  ) : null}
                </article>
              ))}
              {busy ? <p className="assistant-pending">{english ? "Looking it up…" : "Consultando…"}</p> : null}
              {error ? <p className="assistant-error" role="alert">{error}</p> : null}
            </div>
            <form className="assistant-composer" onSubmit={onSubmit}>
              <textarea
                ref={inputRef}
                rows={2}
                value={draft}
                placeholder={english ? "Ask a question or ask it to create something" : "Pregunta o pide que cree algo"}
                aria-label={english ? "Message for the assistant" : "Mensaje para el asistente"}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask(draft);
                  }
                }}
              />
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy || !draft.trim()}>{english ? "Send" : "Enviar"}</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
