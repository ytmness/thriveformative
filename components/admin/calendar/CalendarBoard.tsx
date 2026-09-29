"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { api } from "@/components/admin/clinic/client";

type Appt = {
  id: string;
  patientName: string | null;
  serviceName: string | null;
  staffUserId: string;
  staffName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  locationId: string;
  roomId: string | null;
  notes: string | null;
  durationMinutes: number;
};
type Opt = { id: string; name?: string; first_name?: string; last_name?: string };

const STATUSES = [
  ["booked", "Reservada"],
  ["confirmed", "Confirmada"],
  ["arrived", "Llegó"],
  ["completed", "Completada"],
  ["cancelled", "Cancelada"],
  ["no_show", "No-show"],
] as const;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CalendarBoard({ openCreate }: { openCreate?: boolean }) {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [rows, setRows] = useState<Appt[]>([]);
  const [staff, setStaff] = useState<Opt[]>([]);
  const [services, setServices] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [staffFilter, setStaffFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string> | null>(openCreate ? { status: "booked" } : null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const range = useMemo(() => {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    if (view === "week") start.setDate(start.getDate() - start.getDay());
    if (view === "month") start.setDate(1);
    const end = new Date(start);
    if (view === "day") end.setDate(end.getDate() + 1);
    else if (view === "week") end.setDate(end.getDate() + 7);
    else end.setMonth(end.getMonth() + 1);
    return { start, end };
  }, [anchor, view]);

  const load = useCallback(async () => {
    const data = await api<{ rows: Appt[] }>(`/api/admin/appointments?from=${range.start.toISOString()}&to=${range.end.toISOString()}${staffFilter ? `&staffUserId=${staffFilter}` : ""}`);
    setRows(data.rows);
  }, [range, staffFilter]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    api<{ rows: Opt[] }>("/api/admin/settings/staff").then((r) => setStaff(r.rows)).catch(() => undefined);
    api<{ rows: Opt[] }>("/api/admin/settings/services").then((r) => setServices(r.rows)).catch(() => undefined);
    api<{ rows: Opt[] }>("/api/admin/settings/locations").then((r) => setLocations(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; firstName: string; lastName: string }[] }>("/api/admin/patients?pageSize=100").then((r) => setPatients(r.rows)).catch(() => undefined);
  }, [load]);

  const days = useMemo(() => {
    if (view === "month") {
      const first = new Date(range.start);
      const cells: Date[] = [];
      const lead = first.getDay();
      for (let i = 0; i < lead; i++) cells.push(new Date(first.getFullYear(), first.getMonth(), first.getDate() - (lead - i)));
      const last = new Date(range.end);
      last.setDate(last.getDate() - 1);
      for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) cells.push(new Date(d));
      return cells;
    }
    const count = view === "day" ? 1 : 7;
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(range.start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [range, view]);

  async function saveDraft() {
    if (!draft) return;
    setError(null);
    try {
      if (draft.id) {
        await api(`/api/admin/appointments/${draft.id}`, { method: "PATCH", body: JSON.stringify({
          startsAt: draft.startsAt, status: draft.status, notes: draft.notes, staffUserId: draft.staffUserId, locationId: draft.locationId, patientId: draft.patientId || null, serviceId: draft.serviceId || null,
          cancelReason: draft.status === "cancelled" ? draft.cancelReason || "Cancelada en clínica" : null,
        }) });
      } else {
        await api("/api/admin/appointments", { method: "POST", body: JSON.stringify({
          patientId: draft.patientId || null, serviceId: draft.serviceId || null, staffUserId: draft.staffUserId, locationId: draft.locationId,
          startsAt: draft.startsAt, status: draft.status || "booked", notes: draft.notes || null,
          recurrence: draft.freq ? { freq: draft.freq, count: Number(draft.count || 4) } : null,
        }) });
      }
      setDraft(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function addBlock() {
    const start = prompt("Inicio del bloqueo (YYYY-MM-DDTHH:mm)");
    const end = prompt("Fin del bloqueo (YYYY-MM-DDTHH:mm)");
    if (!start || !end) return;
    try {
      await api("/api/admin/bookouts", { method: "POST", body: JSON.stringify({ startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString(), staffUserId: staffFilter || null, reason: "Bloqueo", locationId: locations[0]?.id || null }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Agenda</p>
        <h1 className="admin-header__title">Calendario</h1>
        <p className="admin-header__desc">Día, semana o mes. Arrastra una cita para moverla. El sistema impide dos reservas del mismo profesional o sala.</p>
      </header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <div className="admin-toolbar">
        <button className="admin-btn" type="button" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - (view === "month" ? 30 : view === "week" ? 7 : 1)))}>Anterior</button>
        <button className="admin-btn" type="button" onClick={() => setAnchor(new Date())}>Hoy</button>
        <button className="admin-btn" type="button" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + (view === "month" ? 30 : view === "week" ? 7 : 1)))}>Siguiente</button>
        {(["day", "week", "month"] as const).map((item) => (
          <button key={item} className={`admin-btn${view === item ? " admin-btn--primary" : ""}`} type="button" onClick={() => setView(item)}>{item === "day" ? "Día" : item === "week" ? "Semana" : "Mes"}</button>
        ))}
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} aria-label="Profesional">
          <option value="">Todos los profesionales</option>
          {staff.map((person) => <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>)}
        </select>
        <button className="admin-btn admin-btn--primary" type="button" onClick={() => setDraft({ status: "booked", startsAt: new Date().toISOString().slice(0, 16) })}>+ Cita</button>
        <button className="admin-btn" type="button" onClick={addBlock}>Bloqueo</button>
      </div>
      <DndContext sensors={sensors} onDragEnd={async (event) => {
        const appt = rows.find((row) => row.id === event.active.id);
        const over = event.over?.id ? String(event.over.id) : "";
        if (!appt || !over) return;
        const [date, hour] = over.split("|");
        const start = new Date(`${date}T${hour}:00`);
        const end = new Date(start.getTime() + appt.durationMinutes * 60000);
        try {
          await api(`/api/admin/appointments/${appt.id}`, { method: "PATCH", body: JSON.stringify({ startsAt: start.toISOString(), endsAt: end.toISOString() }) });
          await load();
        } catch (e) {
          setError(e instanceof Error ? e.message : "No se pudo mover la cita");
        }
      }}>
        {view === "month" ? (
          <div className="admin-form-grid" style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
            {days.map((day) => (
              <button key={day.toISOString()} type="button" className="admin-metric" onClick={() => { setAnchor(day); setView("day"); }}>
                <div className="admin-metric__label">{day.getDate()}</div>
                <div className="admin-metric__value" style={{ fontSize: "1rem" }}>{rows.filter((row) => dayKey(new Date(row.startsAt)) === dayKey(day)).length}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="admin-cal" style={{ ["--cols" as string]: days.length }}>
            <div className="admin-cal__head">
              <div />
              {days.map((day) => <div key={day.toISOString()}>{day.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })}</div>)}
            </div>
            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
              <div className="admin-cal__row" key={hour}>
                <div className="admin-cal__cell">{String(hour).padStart(2, "0")}:00</div>
                {days.map((day) => (
                  <HourCell key={`${dayKey(day)}-${hour}`} id={`${dayKey(day)}|${String(hour).padStart(2, "0")}`} appointments={rows.filter((row) => {
                    const start = new Date(row.startsAt);
                    return dayKey(start) === dayKey(day) && start.getHours() === hour;
                  })} onOpen={(row) => setDraft({
                    id: row.id, patientId: "", serviceId: "", staffUserId: row.staffUserId, locationId: row.locationId,
                    startsAt: row.startsAt.slice(0, 16), status: row.status, notes: row.notes || "",
                  })} />
                ))}
              </div>
            ))}
          </div>
        )}
      </DndContext>
      {draft ? (
        <div className="admin-drawer" role="presentation" onClick={() => setDraft(null)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); saveDraft(); }}>
            <h2 className="admin-header__title">{draft.id ? "Editar cita" : "Nueva cita"}</h2>
            <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
              <label className="admin-field">Paciente<select value={draft.patientId || ""} onChange={(e) => setDraft({ ...draft, patientId: e.target.value })}><option value="">Sin paciente</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label>
              <label className="admin-field">Servicio<select value={draft.serviceId || ""} onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })}><option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label className="admin-field">Profesional<select required value={draft.staffUserId || ""} onChange={(e) => setDraft({ ...draft, staffUserId: e.target.value })}><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select></label>
              <label className="admin-field">Sede<select required value={draft.locationId || ""} onChange={(e) => setDraft({ ...draft, locationId: e.target.value })}><option value="">—</option>{locations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label className="admin-field">Inicio<input type="datetime-local" required value={draft.startsAt || ""} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} /></label>
              <label className="admin-field">Estado<select value={draft.status || "booked"} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {!draft.id ? <label className="admin-field">Recurrencia<select value={draft.freq || ""} onChange={(e) => setDraft({ ...draft, freq: e.target.value })}><option value="">No se repite</option><option value="DAILY">Diaria</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensual</option></select></label> : null}
              {!draft.id && draft.freq ? <label className="admin-field">Repeticiones<input type="number" min={1} max={52} value={draft.count || "4"} onChange={(e) => setDraft({ ...draft, count: e.target.value })} /></label> : null}
              <label className="admin-field span-2">Notas<textarea value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
            </div>
            <div className="admin-toolbar">
              <button className="admin-btn admin-btn--primary" type="submit">Guardar</button>
              <button className="admin-btn" type="button" onClick={() => setDraft(null)}>Cerrar</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function HourCell({ id, appointments, onOpen }: { id: string; appointments: Appt[]; onOpen: (row: Appt) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="admin-cal__cell" style={{ background: isOver ? "rgb(var(--primary) / 0.08)" : undefined }}>
      {appointments.map((row) => <DraggableAppt key={row.id} row={row} onOpen={onOpen} />)}
    </div>
  );
}

function DraggableAppt({ row, onOpen }: { row: Appt; onOpen: (row: Appt) => void }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: row.id });
  return (
    <button ref={setNodeRef} type="button" className="admin-cal__event" {...listeners} {...attributes} onClick={() => onOpen(row)}>
      {(row.patientName || "Cita")} · {row.serviceName || row.status}
    </button>
  );
}
