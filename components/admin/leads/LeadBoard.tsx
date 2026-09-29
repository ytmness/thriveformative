"use client";

import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { api } from "@/components/admin/clinic/client";

type Lead = { id: string; first_name: string; last_name: string; stage_id: string | null; stage_name: string | null; status: string; email?: string; mobile?: string; lost_reason?: string | null; estimated_value?: string | number | null; owner_first?: string | null; owner_last?: string | null; source_name?: string | null };

const EMPTY = { firstName: "", lastName: "", email: "", mobile: "", stageId: "", ownerStaffId: "", marketingSourceId: "", estimatedValue: "", lostReason: "" };

export default function LeadBoard({ startNew }: { startNew?: boolean }) {
  const [rows, setRows] = useState<Lead[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(startNew || false);
  const [form, setForm] = useState(EMPTY);
  const [staff, setStaff] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [activity, setActivity] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const skipClick = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function load() {
    const [leads, stageRows, staffRows, sourceRows] = await Promise.all([
      api<{ rows: Lead[] }>("/api/admin/leads"),
      api<{ rows: { id: string; name: string; sort_order?: number }[] }>("/api/admin/settings/lead-stages"),
      api<{ rows: { id: string; first_name: string; last_name: string }[] }>("/api/admin/settings/staff"),
      api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/marketing-sources"),
    ]);
    const nextStages = [...stageRows.rows].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    setRows(leads.rows);
    setStages(nextStages);
    setStaff(staffRows.rows);
    setSources(sourceRows.rows);
    setForm((current) => (current.stageId ? current : { ...current, stageId: nextStages[0]?.id || "" }));
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  function openNew() {
    setError(null);
    setForm({ ...EMPTY, stageId: stages[0]?.id || "" });
    setOpen(true);
  }

  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">CRM</p><h1 className="admin-header__title">Leads</h1></header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div className="admin-toolbar"><button className="admin-btn admin-btn--primary" type="button" onClick={openNew}>+ Lead</button></div>
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(event) => { skipClick.current = true; setDraggingId(String(event.active.id)); }} onDragCancel={() => { setDraggingId(null); skipClick.current = false; }} onDragEnd={async (event) => {
        const leadId = String(event.active.id);
        const overId = event.over ? String(event.over.id) : "";
        const stageId = stages.some((stage) => stage.id === overId)
          ? overId
          : overId.startsWith("card:") ? rows.find((row) => row.id === overId.slice(5))?.stage_id || "" : "";
        setDraggingId(null);
        window.setTimeout(() => { skipClick.current = false; }, 80);
        const lead = rows.find((row) => row.id === leadId);
        if (!lead || !stageId || lead.stage_id === stageId) return;
        const stage = stages.find((item) => item.id === stageId);
        setRows(rows.map((row) => (row.id === leadId ? { ...row, stage_id: stageId, stage_name: stage?.name || row.stage_name } : row)));
        try {
          await api(`/api/admin/leads/${leadId}`, { method: "PATCH", body: JSON.stringify({ action: "move", stageId }) });
          setNotice("Etapa actualizada.");
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo cambiar la etapa.");
          await load();
        }
      }}>
        <div className="admin-kanban">
          {stages.map((stage) => (
            <StageColumn key={stage.id} stage={stage} leads={rows.filter((row) => row.stage_id === stage.id || (!row.stage_id && stage.id === stages[0]?.id))} onOpen={(lead) => { if (!skipClick.current) setSelected(lead); }} />
          ))}
        </div>
        <DragOverlay>
          {draggingId ? <div className="admin-metric admin-kanban__card"><LeadFace lead={rows.find((row) => row.id === draggingId) || null} /></div> : null}
        </DragOverlay>
      </DndContext>
      {open ? (
        <div className="admin-drawer" onClick={() => setOpen(false)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await api("/api/admin/leads", { method: "POST", body: JSON.stringify(form) });
              setOpen(false);
              setNotice("Lead guardado.");
              setForm({ ...EMPTY, stageId: stages[0]?.id || "" });
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo guardar el lead.");
            }
          }}>
            <div className="admin-drawer__head"><h2 className="admin-header__title">Nuevo lead</h2><button className="admin-btn" type="button" onClick={() => setOpen(false)}>Cerrar</button></div>
            {error ? <div className="admin-alert" role="alert">{error}</div> : null}
            <div className="admin-form-grid">
              <label className="admin-field">Nombre <span className="admin-req">*</span><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
              <label className="admin-field">Apellido <span className="admin-req">*</span><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
              <label className="admin-field">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label className="admin-field">Móvil<input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
              <label className="admin-field">Etapa <span className="admin-req">*</span><select required value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}><option value="" disabled>Elige una etapa</option>{stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
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
            <div className="admin-drawer__head"><h2 className="admin-header__title">{selected.first_name} {selected.last_name}</h2><button className="admin-btn" type="button" onClick={() => setSelected(null)}>Cerrar</button></div>
            <p>{selected.email} · {selected.mobile}</p>
            <div className="admin-toolbar">
              <button className="admin-btn admin-btn--primary" type="button" onClick={async () => { const res = await api<{ patientId: string }>(`/api/admin/leads/${selected.id}/convert`, { method: "POST" }); location.href = `/admin/pacientes/${res.patientId}`; }}>Convertir a paciente</button>
              <button className="admin-btn admin-btn--danger" type="button" onClick={async () => {
                if (!window.confirm("¿Archivar este lead? Dejará el tablero, pero el registro se conserva.")) return;
                try {
                  await api(`/api/admin/leads/${selected.id}`, { method: "PATCH", body: JSON.stringify({ action: "archive" }) });
                  setSelected(null);
                  setNotice("Lead archivado.");
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo archivar el lead.");
                }
              }}>Archivar</button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/leads/${selected.id}/activities`, { method: "POST", body: JSON.stringify({ activityType: "note", body: activity }) }); setActivity(""); setNotice("Actividad registrada."); }}>
              <label className="admin-field">Actividad<textarea value={activity} onChange={(e) => setActivity(e.target.value)} /></label>
              <button className="admin-btn" type="submit">Registrar</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StageColumn({ stage, leads, onOpen }: { stage: { id: string; name: string }; leads: Lead[]; onOpen: (lead: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <section ref={setNodeRef} className="admin-kanban__col" style={{ outline: isOver ? "2px solid rgb(var(--primary) / 0.45)" : undefined }}>
      <h2>{stage.name}</h2>
      {leads.map((row) => <LeadCard key={row.id} lead={row} onOpen={onOpen} />)}
    </section>
  );
}

function LeadFace({ lead }: { lead: Lead | null }) {
  if (!lead) return null;
  return (
    <>
      <div className="admin-metric__value" style={{ fontSize: "1rem" }}>{lead.first_name} {lead.last_name}</div>
      <div className="admin-metric__label">{[lead.owner_first, lead.owner_last].filter(Boolean).join(" ") || lead.status}{lead.estimated_value ? ` · $${Number(lead.estimated_value).toFixed(0)}` : ""}</div>
    </>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const drop = useDroppable({ id: `card:${lead.id}` });
  return (
    <div ref={(node) => { setNodeRef(node); drop.setNodeRef(node); }} className="admin-metric admin-kanban__card" style={{ opacity: isDragging ? 0.35 : 1 }} {...listeners} {...attributes} onClick={() => onOpen(lead)} role="button" tabIndex={0}>
      <LeadFace lead={lead} />
    </div>
  );
}
