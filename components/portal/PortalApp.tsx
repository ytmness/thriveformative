"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";
import { ProfilePhotoGate } from "@/components/account/ProfilePhotoGate";

type Field = { id: string; label: string; type: string; required?: boolean; options?: string[]; help?: string };

export default function PortalApp({ mode, token }: { mode: "login" | "home" | "form"; token?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [home, setHome] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<{ name: string; schema: Field[]; requiresSignature: boolean; status: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === "home") api<Record<string, unknown>>("/api/portal/me").then(setHome).catch(() => { location.href = "/portal/login"; });
    if (mode === "form" && token) api<typeof form>(`/api/public/forms/${token}`).then((data) => setForm(data)).catch((e) => setError(e.message));
  }, [mode, token]);

  if (mode === "login") {
    return (
      <main className="portal-shell">
        <h1 className="admin-header__title">Portal del paciente</h1>
        <form onSubmit={async (e) => { e.preventDefault(); try { await api("/api/portal/login", { method: "POST", body: JSON.stringify({ email, password }) }); const me = await fetch("/api/auth/me", { credentials: "same-origin" }).then((res) => res.json()).catch(() => ({ user: null })); location.href = me?.user?.profilePhotoUrl ? "/portal" : "/cuenta/foto?next=/portal"; } catch (err) { setError(err instanceof Error ? err.message : "Error"); } }}>
          <label className="admin-field">Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="admin-field">Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error ? <p>{error}</p> : null}
          <button className="admin-btn admin-btn--primary" type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  if (mode === "form" && form) {
    return (
      <main className="portal-shell">
        <h1 className="admin-header__title">{form.name}</h1>
        {form.status === "completed" ? <p>Este formulario ya fue enviado.</p> : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const signature = canvas.current?.toDataURL("image/png");
            await api(`/api/public/forms/${token}`, { method: "POST", body: JSON.stringify({ answers, signature: form.requiresSignature ? signature : null, signerName: answers.signer || "" }) });
            setError("Formulario enviado.");
          }}>
            {form.schema.map((field) => <PortalField key={field.id} field={field} value={answers[field.id] || ""} onChange={(value) => setAnswers({ ...answers, [field.id]: value })} />)}
            {form.requiresSignature ? <canvas ref={canvas} width={480} height={160} style={{ border: "1px solid #ccc", borderRadius: 12, touchAction: "none" }} onPointerDown={(e) => { const ctx = canvas.current?.getContext("2d"); if (!ctx || !canvas.current) return; const rect = canvas.current.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top); const move = (ev: PointerEvent) => { ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top); ctx.stroke(); }; const up = () => { window.removeEventListener("pointermove", move); }; window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true }); }} /> : null}
            <button className="admin-btn admin-btn--primary" type="submit">Enviar</button>
            {error ? <p>{error}</p> : null}
          </form>
        )}
      </main>
    );
  }

  const patient = home?.patient as { firstName?: string; lastName?: string; profilePhotoUrl?: string | null } | undefined;
  if (mode === "home" && home && !patient?.profilePhotoUrl) {
    return (
      <main className="portal-shell">
        <ProfilePhotoGate
          firstName={patient?.firstName || "Paciente"}
          lastName={patient?.lastName || ""}
          onDone={() => api<Record<string, unknown>>("/api/portal/me").then(setHome)}
        />
      </main>
    );
  }
  const appointments = (home?.appointments as Record<string, string>[]) || [];
  const invoices = (home?.invoices as Record<string, unknown>[]) || [];
  const forms = (home?.forms as Record<string, string>[]) || [];
  const canBook = home?.canBook !== false;
  const membershipAccess = String(home?.membershipAccess || "");
  return (
    <main className="portal-shell">
      <header className="admin-header"><h1 className="admin-header__title">Hola{patient?.firstName ? `, ${patient.firstName}` : ""}</h1></header>
      {membershipAccess === "grace" ? <p className="booking-error">Tu plan está en periodo de gracia. Actívalo para no perder el acceso.</p> : null}
      {canBook ? (
        <div className="booking-gate__actions" style={{ marginBottom: "1rem" }}>
          <Link className="admin-btn admin-btn--primary" href="/reservar">Agendar cita</Link>
          <a className="admin-btn" href="https://wa.me/528120036699" target="_blank" rel="noreferrer">Mensajes</a>
        </div>
      ) : (
        <div className="booking-gate" style={{ marginBottom: "1rem" }}>
          <p className="booking-gate__title">Activa tu plan para agendar y hablar con tu equipo</p>
          <p className="booking-gate__hint">Puedes ver tu historial. Para agendar o enviar mensajes, activa tu plan.</p>
          <Link className="admin-btn admin-btn--primary" href="/suscribir">Activar plan ahora</Link>
        </div>
      )}
      <h2>Citas</h2>
      {appointments.map((row) => <div key={row.id} className="admin-table__row"><span>{new Date(row.starts_at).toLocaleString("es-MX")} · {row.service_name} · {row.status}</span><button className="admin-btn admin-btn--danger" type="button" onClick={() => api("/api/portal/appointments", { method: "POST", body: JSON.stringify({ appointmentId: row.id, action: "cancel" }) }).then(() => location.reload())}>Cancelar</button></div>)}
      <h2>Formularios</h2>
      {forms.map((row) => <div key={row.id} className="admin-table__row">{row.name} · {row.status}</div>)}
      <h2>Facturas</h2>
      {invoices.map((row) => <div key={String(row.id)} className="admin-table__row">{String(row.invoice_number)} · {String(row.status)} · ${Number(row.total || 0).toFixed(2)}</div>)}
      <button className="admin-btn" type="button" onClick={() => api("/api/portal/logout", { method: "POST" }).then(() => { location.href = "/portal/login"; })}>Salir</button>
    </main>
  );
}

function PortalField({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  if (field.type === "heading") return <h2 className="admin-header__title" style={{ fontSize: "1.2rem", marginTop: "1rem" }}>{field.label}</h2>;
  if (field.type === "signature") return null;
  if (field.type === "checkbox") {
    return <label className="admin-check"><input type="checkbox" required={field.required} checked={value === "sí"} onChange={(event) => onChange(event.target.checked ? "sí" : "")} />{field.label}</label>;
  }
  const hint = field.help ? <span className="form-studio__help">{field.help}</span> : null;
  if (field.type === "textarea") {
    return <label className="admin-field">{field.label}{hint}<textarea required={field.required} rows={4} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (field.type === "select") {
    return (
      <label className="admin-field">{field.label}{hint}
        <select required={field.required} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Elige…</option>
          {(field.options || []).map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  return <label className="admin-field">{field.label}{hint}<input required={field.required} type={field.type === "date" ? "date" : "text"} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
