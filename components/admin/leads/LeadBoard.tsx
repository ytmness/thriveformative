"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

type Lead = { id: string; first_name: string; last_name: string; stage_id: string | null; stage_name: string | null; status: string; email?: string; mobile?: string; lost_reason?: string | null; estimated_value?: string | number | null; owner_first?: string | null; owner_last?: string | null; source_name?: string | null };

export default function LeadBoard({ startNew }: { startNew?: boolean }) {
  const [rows, setRows] = useState<Lead[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(startNew || false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", mobile: "", stageId: "", ownerStaffId: "", marketingSourceId: "", estimatedValue: "", lostReason: "" });
  const [staff, setStaff] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [activity, setActivity] = useState("");

  async function load() {
    const [leads, stageRows, staffRows, sourceRows] = await Promise.all([
      api<{ rows: Lead[] }>("/api/admin/leads"),
      api<{ rows: { id: string; name: string; sort_order?: number }[] }>("/api/admin/settings/lead-stages"),
      api<{ rows: { id: string; first_name: string; last_name: string }[] }>("/api/admin/settings/staff"),
      api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/marketing-sources"),
    ]);
    setRows(leads.rows);
    setStages([...stageRows.rows].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)));
    setStaff(staffRows.rows);
    setSources(sourceRows.rows);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">CRM</p><h1 className="admin-header__title">Leads</h1></header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div className="admin-toolbar"><button className="admin-btn admin-btn--primary" type="button" onClick={() => setOpen(true)}>+ Lead</button></div>
      <div className="admin-kanban">
        {stages.map((stage) => (
          <section key={stage.id} className="admin-kanban__col">
            <h2>{stage.name}</h2>
            {rows.filter((row) => row.stage_id === stage.id).map((row) => (
              <button key={row.id} type="button" className="admin-metric" onClick={() => setSelected(row)}>
                <div className="admin-metric__value" style={{ fontSize: "1rem" }}>{row.first_name} {row.last_name}</div>
                <div className="admin-metric__label">{[row.owner_first, row.owner_last].filter(Boolean).join(" ") || row.status}{row.estimated_value ? ` · $${Number(row.estimated_value).toFixed(0)}` : ""}</div>
              </button>
            ))}
          </section>
        ))}
      </div>
      {open ? (
        <div className="admin-drawer" onClick={() => setOpen(false)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await api("/api/admin/leads", { method: "POST", body: JSON.stringify(form) });
              setOpen(false);
              setNotice("Lead guardado.");
              setForm({ firstName: "", lastName: "", email: "", mobile: "", stageId: "", ownerStaffId: "", marketingSourceId: "", estimatedValue: "", lostReason: "" });
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo guardar el lead.");
            }
          }}>
            <div className="admin-drawer__head"><h2 className="admin-header__title">Nuevo lead</h2><button className="admin-btn" type="button" onClick={() => setOpen(false)}>Cerrar</button></div>
            {error ? <div className="admin-alert" role="alert">{error}</div> : null}
            <div className="admin-form-grid">
              <label className="admin-field">Nombre<input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
              <label className="admin-field">Apellido<input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
              <label className="admin-field">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label className="admin-field">Móvil<input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
              <label className="admin-field">Etapa<select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}><option value="">—</option>{stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label className="admin-field">Responsable<select value={form.ownerStaffId} onChange={(e) => setForm({ ...form, ownerStaffId: e.target.value })}><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select></label>
              <label className="admin-field">Fuente<select value={form.marketingSourceId} onChange={(e) => setForm({ ...form, marketingSourceId: e.target.value })}><option value="">—</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label className="admin-field">Valor estimado<input type="number" min="0" step="1" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} /></label>
            </div>
            <button className="admin-btn admin-btn--primary" type="submit">Guardar</button>
          </form>
        </div>
      ) : null}
      {selected ? (
        <div className="admin-drawer" onClick={() => setSelected(null)}>
          <div className="admin-drawer__panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-header__title">{selected.first_name} {selected.last_name}</h2>
            <p>{selected.email} · {selected.mobile}</p>
            <div className="admin-toolbar">
              <button className="admin-btn admin-btn--primary" type="button" onClick={async () => { const res = await api<{ patientId: string }>(`/api/admin/leads/${selected.id}/convert`, { method: "POST" }); location.href = `/admin/pacientes/${res.patientId}`; }}>Convertir a paciente</button>
              <button className="admin-btn admin-btn--danger" type="button" onClick={async () => { await api(`/api/admin/leads/${selected.id}`, { method: "PATCH", body: JSON.stringify({ ...selected, firstName: selected.first_name, lastName: selected.last_name, status: "lost", lostReason: "Sin seguimiento" }) }); setSelected(null); await load(); }}>Marcar perdido</button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/leads/${selected.id}/activities`, { method: "POST", body: JSON.stringify({ activityType: "note", body: activity }) }); setActivity(""); }}>
              <label className="admin-field">Actividad<textarea value={activity} onChange={(e) => setActivity(e.target.value)} /></label>
              <button className="admin-btn" type="submit">Registrar</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
