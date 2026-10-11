"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { api } from "@/components/admin/clinic/client";
import { countryCode, useClinicScope } from "@/components/admin/clinic/ClinicScope";
import { CreateOffer } from "@/components/admin/tutorial";

type Appt = {
  id: string;
  patientId: string | null;
  patientName: string | null;
  serviceId: string | null;
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
type Opt = { id: string; name?: string; first_name?: string; last_name?: string; timezone?: string; country?: string | null; location_id?: string; is_active?: boolean };

const CLINIC_TZ = "America/Chicago";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function clinicWall(iso: string, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(iso));
  const map: Record<string, string> = {};
  for (const part of formatted) map[part.type] = part.value;
  const hour = map.hour === "24" ? "00" : map.hour;
  const date = `${map.year}-${map.month}-${map.day}`;
  return { date, hour: Number(hour), input: `${date}T${hour}:${map.minute}` };
}

function nextClinicSlot(timeZone: string) {
  const wall = clinicWall(new Date().toISOString(), timeZone);
  let hour = wall.hour;
  let date = wall.date;
  if (hour < 8) hour = 9;
  else if (hour >= 19) {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    date = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
    hour = 9;
  }
  return `${date}T${pad(hour)}:00`;
}

const STATUSES = [
  ["booked", "Reservada"],
  ["confirmed", "Confirmada"],
  ["arrived", "Llegó"],
  ["completed", "Completada"],
  ["cancelled", "Cancelada"],
  ["no_show", "No-show"],
] as const;

export default function CalendarBoard({ openCreate }: { openCreate?: boolean }) {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [rows, setRows] = useState<Appt[]>([]);
  const [staff, setStaff] = useState<Opt[]>([]);
  const [services, setServices] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [staffFilter, setStaffFilter] = useState("");
  const [columnsBy, setColumnsBy] = useState<"day" | "staff" | "room">("day");
  const [rooms, setRooms] = useState<Opt[]>([]);
  const [waitlist, setWaitlist] = useState<{ id: string; first_name: string | null; last_name: string | null; service_name: string | null }[]>([]);
  const [block, setBlock] = useState<{ startsAt: string; endsAt: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [clinicTz, setClinicTz] = useState(CLINIC_TZ);
  const [draft, setDraft] = useState<Record<string, string> | null>(openCreate ? { status: "booked", startsAt: nextClinicSlot(CLINIC_TZ) } : null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const scope = useClinicScope();
  const english = scope.country === "US";
  const siteOptions = locations.filter((row) => row.is_active !== false && countryCode(row.country) === scope.country);
  const roomOptions = rooms.filter((row) => siteOptions.some((site) => site.id === row.location_id));
  const preferredLocation = scope.locationId || siteOptions[0]?.id || "";

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
    const params = new URLSearchParams({
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      country: scope.country,
    });
    if (staffFilter) params.set("staffUserId", staffFilter);
    if (scope.locationId) params.set("locationId", scope.locationId);
    const data = await api<{ rows: Appt[] }>(`/api/admin/appointments?${params.toString()}`);
    setRows(data.rows.filter((row) => row.status !== "cancelled"));
  }, [range, staffFilter, scope.country, scope.locationId]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    api<{ rows: Opt[] }>("/api/admin/settings/staff").then((r) => setStaff(r.rows)).catch(() => undefined);
    api<{ rows: Opt[] }>("/api/admin/settings/services").then((r) => setServices(r.rows)).catch(() => undefined);
    api<{ rows: Opt[] }>("/api/admin/settings/locations").then((r) => setLocations(r.rows)).catch(() => undefined);
    api<{ rows: Opt[] }>("/api/admin/settings/rooms").then((r) => setRooms(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; first_name: string | null; last_name: string | null; service_name: string | null }[] }>("/api/admin/waitlist").then((r) => setWaitlist(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; firstName: string; lastName: string }[] }>(`/api/admin/patients?pageSize=100&${scope.query}`).then((r) => setPatients(r.rows)).catch(() => undefined).finally(() => setCatalogReady(true));
  }, [load, scope.query]);

  useEffect(() => {
    const site = siteOptions.find((row) => row.id === preferredLocation) || siteOptions[0];
    if (site?.timezone) setClinicTz(site.timezone);
  }, [preferredLocation, locations, scope.country]);

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

  const boardColumns = useMemo(() => {
    const day = days[0];
    const sameDay = (row: Appt) => day && clinicWall(row.startsAt, clinicTz).date === localKey(day);
    if (view === "day" && columnsBy === "staff") {
      return staff.map((person) => ({
        key: person.id,
        label: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
        match: (row: Appt, hour: number) => sameDay(row) && row.staffUserId === person.id && clinicWall(row.startsAt, clinicTz).hour === hour,
      }));
    }
    if (view === "day" && columnsBy === "room") {
      return roomOptions.map((room) => ({
        key: room.id,
        label: room.name || "Sala",
        match: (row: Appt, hour: number) => sameDay(row) && row.roomId === room.id && clinicWall(row.startsAt, clinicTz).hour === hour,
      }));
    }
    return days.map((item) => ({
      key: localKey(item),
      label: item.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
      match: (row: Appt, hour: number) => clinicWall(row.startsAt, clinicTz).date === localKey(item) && clinicWall(row.startsAt, clinicTz).hour === hour,
    }));
  }, [clinicTz, columnsBy, days, roomOptions, staff, view]);

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
      setNotice("Cita guardada.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function setStatus(status: "confirmed" | "cancelled") {
    if (!draft?.id) return;
    setError(null);
    try {
      await api(`/api/admin/appointments/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          cancelReason: status === "cancelled" ? "Cancelada desde el calendario" : null,
        }),
      });
      setDraft(null);
      setNotice(status === "confirmed" ? "Cita confirmada." : "Cita cancelada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la cita.");
    }
  }

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!block) return;
    try {
      await api("/api/admin/bookouts", { method: "POST", body: JSON.stringify({ startsAt: new Date(block.startsAt).toISOString(), endsAt: new Date(block.endsAt).toISOString(), staffUserId: staffFilter || null, reason: block.reason || "Bloqueo", locationId: preferredLocation || null }) });
      setBlock(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">{english ? "Schedule" : "Agenda"}</p>
        <h1 className="admin-header__title">{english ? "Calendar" : "Calendario"}</h1>
        <p className="admin-header__desc">{english ? "Day, week, or month. Drag an appointment to move it. The same provider or room cannot be booked twice." : "Día, semana o mes. Arrastra una cita para moverla. El sistema impide dos reservas del mismo profesional o sala."}</p>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div className="admin-toolbar" data-tour="cal-toolbar">
        <button className="admin-btn" type="button" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - (view === "month" ? 30 : view === "week" ? 7 : 1)))}>{english ? "Previous" : "Anterior"}</button>
        <button className="admin-btn" type="button" onClick={() => setAnchor(new Date())}>{english ? "Today" : "Hoy"}</button>
        <button className="admin-btn" type="button" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + (view === "month" ? 30 : view === "week" ? 7 : 1)))}>{english ? "Next" : "Siguiente"}</button>
        {(["day", "week", "month"] as const).map((item) => (
          <button key={item} className={`admin-btn${view === item ? " admin-btn--primary" : ""}`} type="button" onClick={() => setView(item)}>{item === "day" ? (english ? "Day" : "Día") : item === "week" ? (english ? "Week" : "Semana") : (english ? "Month" : "Mes")}</button>
        ))}
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} aria-label={english ? "Provider" : "Profesional"}>
          <option value="">{english ? "All providers" : "Todos los profesionales"}</option>
          {staff.map((person) => <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>)}
        </select>
        <button className="admin-btn admin-btn--primary" type="button" data-tour="cal-new" onClick={() => setDraft({ status: "booked", startsAt: nextClinicSlot(clinicTz), locationId: preferredLocation, staffUserId: staffFilter })}>{english ? "+ Appointment" : "+ Cita"}</button>
        <button className="admin-btn" type="button" onClick={() => setBlock({ startsAt: "", endsAt: "", reason: english ? "Block" : "Bloqueo" })}>{english ? "Block" : "Bloqueo"}</button>
        {view === "day" ? (
          <select value={columnsBy} onChange={(e) => setColumnsBy(e.target.value as "day" | "staff" | "room")} aria-label={english ? "Columns" : "Columnas"}>
            <option value="day">{english ? "One column" : "Una columna"}</option>
            <option value="staff">{english ? "By provider" : "Por profesional"}</option>
            <option value="room">{english ? "By room" : "Por sala"}</option>
          </select>
        ) : null}
      </div>
      <DndContext sensors={sensors} onDragEnd={async (event) => {
        const appt = rows.find((row) => row.id === event.active.id);
        const over = event.over?.id ? String(event.over.id) : "";
        if (!appt || !over) return;
        const [columnKey, hour] = over.split("|");
        const start = new Date(anchor);
        if (view !== "day" || columnsBy === "day") {
          const [date] = [columnKey];
          start.setTime(new Date(`${date}T${hour}:00`).getTime());
        } else {
          start.setHours(Number(hour), 0, 0, 0);
        }
        const end = new Date(start.getTime() + appt.durationMinutes * 60000);
        const patch: Record<string, string> = { startsAt: start.toISOString(), endsAt: end.toISOString() };
        if (view === "day" && columnsBy === "staff") patch.staffUserId = columnKey;
        if (view === "day" && columnsBy === "room") patch.roomId = columnKey;
        try {
          await api(`/api/admin/appointments/${appt.id}`, { method: "PATCH", body: JSON.stringify(patch) });
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
                <div className="admin-metric__value" style={{ fontSize: "1rem" }}>{rows.filter((row) => clinicWall(row.startsAt, clinicTz).date === localKey(day)).length}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="admin-cal" data-tour="cal-grid" style={{ ["--cols" as string]: boardColumns.length }}>
            <div className="admin-cal__head">
              <div />
              {boardColumns.map((column) => <div key={column.key}>{column.label}</div>)}
            </div>
            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
              <div className="admin-cal__row" key={hour}>
                <div className="admin-cal__cell">{String(hour).padStart(2, "0")}:00</div>
                {boardColumns.map((column) => (
                  <HourCell key={`${column.key}-${hour}`} id={`${column.key}|${String(hour).padStart(2, "0")}`} appointments={rows.filter((row) => column.match(row, hour))} onCreate={() => {
                    const day = view === "day" ? days[0] : days.find((item) => localKey(item) === column.key) || days[0];
                    const next: Record<string, string> = { status: "booked", startsAt: day ? `${localKey(day)}T${pad(hour)}:00` : nextClinicSlot(clinicTz), locationId: preferredLocation };
                    if (view === "day" && columnsBy === "staff") next.staffUserId = column.key;
                    else if (staffFilter) next.staffUserId = staffFilter;
                    setDraft(next);
                  }} onOpen={(row) => setDraft({
                    id: row.id,
                    patientId: row.patientId || "",
                    patientName: row.patientName || "",
                    serviceId: row.serviceId || "",
                    serviceName: row.serviceName || "",
                    staffUserId: row.staffUserId,
                    locationId: row.locationId,
                    startsAt: clinicWall(row.startsAt, clinicTz).input,
                    status: row.status,
                    notes: row.notes || "",
                  })} />
                ))}
              </div>
            ))}
          </div>
        )}
      </DndContext>
      {waitlist.length ? (
        <section style={{ marginTop: "1rem" }}>
          <h2>Lista de espera</h2>
          {waitlist.map((row) => <div key={row.id} className="admin-table__row">{[row.first_name, row.last_name].filter(Boolean).join(" ") || "Paciente"} · {row.service_name || "Servicio por confirmar"}</div>)}
        </section>
      ) : <p className="admin-header__desc">Lista de espera vacía.</p>}
      <form className="admin-toolbar" style={{ marginTop: "0.75rem" }} onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        try {
          await api("/api/admin/waitlist", { method: "POST", body: JSON.stringify({ patientId: String(data.get("patient") || ""), serviceId: String(data.get("service") || "") || null, staffUserId: staffFilter || null, locationId: preferredLocation || null, notes: String(data.get("notes") || "") }) });
          setNotice("Paciente agregado a la lista de espera.");
          e.currentTarget.reset();
          const next = await api<{ rows: { id: string; first_name: string | null; last_name: string | null; service_name: string | null }[] }>("/api/admin/waitlist");
          setWaitlist(next.rows);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo agregar a la lista de espera.");
        }
      }}>
        <select name="patient" required><option value="">Paciente en espera</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select>
        <select name="service"><option value="">Servicio</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <input name="notes" placeholder="Nota" />
        <button className="admin-btn" type="submit">Agregar a la espera</button>
      </form>
      {block ? (
        <form className="admin-form-grid" onSubmit={addBlock} style={{ marginTop: "1rem" }}>
          <label className="admin-field">Inicio del bloqueo<input type="datetime-local" required value={block.startsAt} onChange={(e) => setBlock({ ...block, startsAt: e.target.value })} /></label>
          <label className="admin-field">Fin<input type="datetime-local" required value={block.endsAt} onChange={(e) => setBlock({ ...block, endsAt: e.target.value })} /></label>
          <label className="admin-field">Motivo<input value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} /></label>
          <div className="admin-toolbar"><button className="admin-btn admin-btn--primary" type="submit">Guardar bloqueo</button><button className="admin-btn" type="button" onClick={() => setBlock(null)}>Cancelar</button></div>
        </form>
      ) : null}
      {draft ? (
        <div className="admin-drawer admin-drawer--rail" role="presentation" onClick={() => setDraft(null)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); saveDraft(); }}>
            <div className="admin-drawer__head">
              <p className="admin-sidebar__eyebrow">{english ? "Calendar" : "Calendario"}</p>
              <h2 className="admin-sidebar__title">{draft.id ? (english ? "Edit appointment" : "Editar cita") : (english ? "New appointment" : "Nueva cita")}</h2>
            </div>
            <div className="admin-drawer__body">
              <div className="admin-form-grid" data-tour="cal-form">
                <label className="admin-field">{english ? "Patient" : "Paciente"}<select value={draft.patientId || ""} onChange={(e) => setDraft({ ...draft, patientId: e.target.value })}><option value="">{english ? "No patient" : "Sin paciente"}</option>{draft.patientId && !patients.some((p) => p.id === draft.patientId) ? <option value={draft.patientId}>{draft.patientName || (english ? "Patient" : "Paciente")}</option> : null}{patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select><CreateOffer show={catalogReady && !patients.length} kind="patient" href="/admin/pacientes?nuevo=1" /></label>
                <label className="admin-field">{english ? "Service" : "Servicio"}<select value={draft.serviceId || ""} onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })}><option value="">—</option>{draft.serviceId && !services.some((s) => s.id === draft.serviceId) ? <option value={draft.serviceId}>{draft.serviceName || (english ? "Service" : "Servicio")}</option> : null}{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><CreateOffer show={catalogReady && !services.length} kind="service" href="/admin/catalogo/servicios?nuevo=1" /></label>
                <label className="admin-field">{english ? "Provider" : "Profesional"}<select required value={draft.staffUserId || ""} onChange={(e) => setDraft({ ...draft, staffUserId: e.target.value })}><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select><CreateOffer show={catalogReady && !staff.length} kind="staff" href="/admin/configuracion/equipo?nuevo=1" /></label>
                <label className="admin-field">{english ? "Location" : "Sede"}<select required value={draft.locationId || ""} onChange={(e) => setDraft({ ...draft, locationId: e.target.value })}><option value="">—</option>{siteOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><CreateOffer show={catalogReady && !siteOptions.length} kind="location" href="/admin/configuracion/sedes?nuevo=1" /></label>
                <label className="admin-field">{english ? "Starts" : "Inicio"}<input type="datetime-local" required value={draft.startsAt || ""} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} /></label>
                <label className="admin-field">{english ? "Status" : "Estado"}<select value={draft.status || "booked"} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{english ? { booked: "Booked", confirmed: "Confirmed", arrived: "Arrived", completed: "Completed", cancelled: "Cancelled", no_show: "No-show" }[value] : label}</option>)}</select></label>
                {!draft.id ? <label className="admin-field">{english ? "Repeats" : "Recurrencia"}<select value={draft.freq || ""} onChange={(e) => setDraft({ ...draft, freq: e.target.value })}><option value="">{english ? "Does not repeat" : "No se repite"}</option><option value="DAILY">{english ? "Daily" : "Diaria"}</option><option value="WEEKLY">{english ? "Weekly" : "Semanal"}</option><option value="MONTHLY">{english ? "Monthly" : "Mensual"}</option></select></label> : null}
                {!draft.id && draft.freq ? <label className="admin-field">{english ? "Times" : "Repeticiones"}<input type="number" min={1} max={52} value={draft.count || "4"} onChange={(e) => setDraft({ ...draft, count: e.target.value })} /></label> : null}
                <label className="admin-field span-2">{english ? "Notes" : "Notas"}<textarea value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
              </div>
            </div>
            <div className="admin-drawer__foot">
              <button className="admin-btn admin-btn--primary" type="submit">{english ? "Save" : "Guardar"}</button>
              {draft.id && draft.status !== "confirmed" && draft.status !== "cancelled" ? (
                <button className="admin-btn" type="button" onClick={() => void setStatus("confirmed")}>{english ? "Confirm" : "Confirmar"}</button>
              ) : null}
              {draft.id && draft.status !== "cancelled" ? (
                <button className="admin-btn admin-btn--danger" type="button" onClick={() => {
                  if (!window.confirm(english ? "Cancel this appointment? The patient is notified." : "¿Cancelar esta cita? El paciente recibe el aviso.")) void setStatus("cancelled");
                }}>{english ? "Cancel appointment" : "Cancelar"}</button>
              ) : null}
              {draft.id ? <button className="admin-btn" type="button" onClick={async () => {
                if (!window.confirm(english ? "Archive this appointment? It leaves the calendar and stays on record." : "¿Archivar esta cita? Quedará cancelada y saldrá del calendario. El registro se conserva.")) return;
                try {
                  await api(`/api/admin/appointments/${draft.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled", cancelReason: "Archivada desde el calendario" }) });
                  setDraft(null);
                  setNotice(english ? "Appointment archived." : "Cita archivada.");
                  await load();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "No se pudo archivar la cita.");
                }
              }}>{english ? "Archive" : "Archivar"}</button> : null}
              <button className="admin-btn admin-btn--ghost" type="button" onClick={() => setDraft(null)}>{english ? "Close" : "Cerrar"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function HourCell({ id, appointments, onOpen, onCreate }: { id: string; appointments: Appt[]; onOpen: (row: Appt) => void; onCreate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="admin-cal__cell" style={{ background: isOver ? "rgb(var(--primary) / 0.08)" : undefined }} onClick={onCreate} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onCreate(); }}>
      {appointments.map((row) => <DraggableAppt key={row.id} row={row} onOpen={onOpen} />)}
    </div>
  );
}

function DraggableAppt({ row, onOpen }: { row: Appt; onOpen: (row: Appt) => void }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: row.id });
  return (
    <button ref={setNodeRef} type="button" className="admin-cal__event" {...listeners} {...attributes} onClick={(e) => { e.stopPropagation(); onOpen(row); }}>
      {(row.patientName || "Cita")} · {row.serviceName || row.status}
    </button>
  );
}
