"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

const SECTIONS = [
  ["sedes", "Sedes"],
  ["salas", "Salas"],
  ["servicios", "Servicios"],
  ["categorias", "Categorías"],
  ["equipo", "Equipo"],
  ["horarios", "Horarios"],
  ["impuestos", "Impuestos"],
  ["pagos", "Pagos"],
  ["campos", "Campos"],
  ["politicas", "Políticas"],
  ["facturacion", "Facturación"],
] as const;

const MAP: Record<string, string> = {
  sedes: "locations",
  salas: "rooms",
  servicios: "services",
  categorias: "service-categories",
  equipo: "staff",
  horarios: "schedules",
  impuestos: "taxes",
  pagos: "payment-methods",
  campos: "custom-fields",
  politicas: "booking",
  facturacion: "clinic",
};

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Row = Record<string, unknown>;

export default function SettingsPanel({ section }: { section: string }) {
  const apiSection = MAP[section] || "locations";
  const [rows, setRows] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [staff, setStaff] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [taxes, setTaxes] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    const data = await api<{ rows: Row[] }>(`/api/admin/settings/${apiSection}`);
    setRows(data.rows || []);
    if (apiSection === "booking" && data.rows[0]) setForm(bookingFrom(data.rows[0]));
    if (apiSection === "clinic") {
      const next: Row = {};
      for (const row of data.rows) {
        const value = row.value as { text?: string } | string | null;
        next[String(row.key)] = typeof value === "object" && value ? value.text || "" : String(value || "");
      }
      setForm(next);
    }
  }

  useEffect(() => {
    setForm({});
    setEditing(null);
    setSaved(false);
    load().catch((e) => setError(e.message));
    api<{ rows: Row[] }>("/api/admin/settings/locations").then((r) => setLocations(r.rows)).catch(() => undefined);
    api<{ rows: Row[] }>("/api/admin/settings/staff").then((r) => setStaff(r.rows)).catch(() => undefined);
    api<{ rows: Row[] }>("/api/admin/settings/service-categories").then((r) => setCategories(r.rows)).catch(() => undefined);
    api<{ rows: Row[] }>("/api/admin/settings/taxes").then((r) => setTaxes(r.rows)).catch(() => undefined);
  }, [apiSection]);

  function set(key: string, value: unknown) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      if (apiSection === "clinic") {
        for (const key of ["cancellation_policy", "invoice_footer", "privacy_notice"]) {
          await api("/api/admin/settings/clinic", { method: "POST", body: JSON.stringify({ key, value: { text: String(form[key] || "") } }) });
        }
      } else if (apiSection === "booking") {
        await api("/api/admin/settings/booking", { method: "POST", body: JSON.stringify(form) });
      } else if (editing) {
        await api(`/api/admin/settings/${apiSection}/${editing}`, { method: "PATCH", body: JSON.stringify(payload(apiSection, form)) });
      } else {
        await api(`/api/admin/settings/${apiSection}`, { method: "POST", body: JSON.stringify(payload(apiSection, form)) });
      }
      setForm(apiSection === "booking" || apiSection === "clinic" ? form : {});
      setEditing(null);
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  const title = SECTIONS.find((item) => item[0] === section)?.[1] || "Configuración";

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Clínica</p>
        <h1 className="admin-header__title">{title}</h1>
      </header>
      <nav className="admin-tabs admin-tabs--wrap" aria-label="Secciones de configuración">
        {SECTIONS.map(([id, label]) => (
          <a key={id} className={section === id ? "is-active" : ""} href={`/admin/configuracion/${id}`}>{label}</a>
        ))}
      </nav>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {saved ? <p className="admin-header__desc">Guardado.</p> : null}
      <form className="admin-form-grid" onSubmit={submit}>
        <Fields section={apiSection} form={form} set={set} locations={locations} staff={staff} categories={categories} taxes={taxes} editing={Boolean(editing)} />
        <div className="admin-toolbar span-2">
          <button className="admin-btn admin-btn--primary" type="submit">{editing ? "Guardar cambios" : apiSection === "booking" || apiSection === "clinic" ? "Guardar" : "Crear"}</button>
          {editing ? <button className="admin-btn" type="button" onClick={() => { setEditing(null); setForm({}); }}>Cancelar edición</button> : null}
        </div>
      </form>
      {apiSection !== "booking" && apiSection !== "clinic" ? (
        <div className="admin-table-wrap" style={{ marginTop: "1.25rem" }}>
          <div className="admin-table__row admin-table__head"><span>Registro</span><span>Detalle</span><span /></div>
          {rows.map((row) => (
            <div key={String(row.id)} className="admin-table__row">
              <div className="admin-table__cell-title">{labelOf(apiSection, row)}</div>
              <div className="admin-table__cell-sub">{detailOf(apiSection, row)}</div>
              <div className="admin-toolbar">
                <button className="admin-btn" type="button" onClick={() => { setEditing(String(row.id)); setForm(formFrom(apiSection, row)); }}>Editar</button>
                <button className="admin-btn admin-btn--danger" type="button" onClick={async () => {
                  await api(`/api/admin/settings/${apiSection}/${row.id}`, { method: "DELETE" });
                  await load();
                }}>Quitar</button>
              </div>
            </div>
          ))}
          {!rows.length ? <div className="admin-table__empty">Todavía no hay registros. Usa el formulario de arriba para crear el primero.</div> : null}
        </div>
      ) : null}
    </>
  );
}

function Fields({ section, form, set, locations, staff, categories, taxes, editing }: {
  section: string;
  form: Row;
  set: (key: string, value: unknown) => void;
  locations: Row[];
  staff: Row[];
  categories: Row[];
  taxes: Row[];
  editing: boolean;
}) {
  if (section === "locations") return (
    <>
      <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
      <Text label="Zona horaria" value={form.timezone || "America/Chicago"} onChange={(v) => set("timezone", v)} />
      <Text label="Calle" value={form.street} onChange={(v) => set("street", v)} />
      <Text label="Ciudad" value={form.city} onChange={(v) => set("city", v)} />
      <Text label="Estado" value={form.state} onChange={(v) => set("state", v)} />
      <Text label="País" value={form.country} onChange={(v) => set("country", v)} />
      <Text label="Código postal" value={form.postalCode} onChange={(v) => set("postalCode", v)} />
      <Text label="Teléfono" value={form.phone} onChange={(v) => set("phone", v)} />
      <Text label="Email" value={form.email} onChange={(v) => set("email", v)} />
    </>
  );
  if (section === "rooms") return (
    <>
      <Select label="Sede" value={form.locationId} onChange={(v) => set("locationId", v)} options={locations.map((row) => [String(row.id), String(row.name)])} required />
      <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
      <Text label="Color" value={form.color || "#d4a473"} onChange={(v) => set("color", v)} />
      <Text label="Capacidad" value={form.capacity || "1"} onChange={(v) => set("capacity", Number(v))} />
    </>
  );
  if (section === "services") return (
    <>
      <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
      <Select label="Categoría" value={form.categoryId} onChange={(v) => set("categoryId", v)} options={categories.map((row) => [String(row.id), String(row.name)])} />
      <Text label="Duración (min)" value={form.durationMinutes || "60"} onChange={(v) => set("durationMinutes", Number(v))} />
      <Text label="Precio" value={form.price || ""} onChange={(v) => set("price", Number(v))} />
      <Select label="Impuesto" value={form.taxId} onChange={(v) => set("taxId", v)} options={taxes.map((row) => [String(row.id), String(row.name)])} />
      <Text label="Descripción" value={form.description} onChange={(v) => set("description", v)} />
      <Check label="Se puede reservar en línea" checked={form.isOnlineBookable !== false} onChange={(v) => set("isOnlineBookable", v)} />
    </>
  );
  if (section === "service-categories") return <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />;
  if (section === "staff") return (
    <>
      <Text label="Nombre" value={form.firstName} onChange={(v) => set("firstName", v)} required />
      <Text label="Apellido" value={form.lastName} onChange={(v) => set("lastName", v)} required />
      <Text label="Email" value={form.email} onChange={(v) => set("email", v)} required />
      <Text label={editing ? "Nueva contraseña (opcional)" : "Contraseña"} value={form.password} onChange={(v) => set("password", v)} />
      <Text label="Puesto" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />
      <Text label="Teléfono" value={form.phone} onChange={(v) => set("phone", v)} />
      <Select label="Sede" value={form.defaultLocationId} onChange={(v) => set("defaultLocationId", v)} options={locations.map((row) => [String(row.id), String(row.name)])} />
      <Check label="Atiende citas" checked={Boolean(form.isBookable)} onChange={(v) => set("isBookable", v)} />
      <fieldset className="admin-field span-2">
        <legend>Rol</legend>
        {[["admin", "Administración"], ["doctor", "Medicina"], ["reception", "Recepción"]].map(([key, label]) => (
          <label key={key} className="admin-check">
            <input type="checkbox" checked={Array.isArray(form.roles) && (form.roles as string[]).includes(key)} onChange={(e) => {
              const current = Array.isArray(form.roles) ? (form.roles as string[]) : [];
              set("roles", e.target.checked ? [...current, key] : current.filter((item) => item !== key));
            }} />
            {label}
          </label>
        ))}
      </fieldset>
    </>
  );
  if (section === "schedules") return (
    <>
      <Select label="Profesional" value={form.staffUserId} onChange={(v) => set("staffUserId", v)} options={staff.map((row) => [String(row.id), `${row.first_name} ${row.last_name}`])} required />
      <Select label="Sede" value={form.locationId} onChange={(v) => set("locationId", v)} options={locations.map((row) => [String(row.id), String(row.name)])} required />
      <Select label="Día" value={form.dayOfWeek ?? "1"} onChange={(v) => set("dayOfWeek", Number(v))} options={DAYS.map((name, index) => [String(index), name])} />
      <Text label="Desde" value={form.startTime || "09:00"} onChange={(v) => set("startTime", v)} />
      <Text label="Hasta" value={form.endTime || "17:00"} onChange={(v) => set("endTime", v)} />
    </>
  );
  if (section === "taxes") return (
    <>
      <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
      <Text label="Tasa %" value={form.rate || "0"} onChange={(v) => set("rate", Number(v))} />
      <Check label="Impuesto por defecto" checked={Boolean(form.isDefault)} onChange={(v) => set("isDefault", v)} />
    </>
  );
  if (section === "payment-methods") return (
    <>
      <Text label="Clave" value={form.key} onChange={(v) => set("key", v)} required />
      <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
      <Check label="Activo" checked={form.isActive !== false} onChange={(v) => set("isActive", v)} />
    </>
  );
  if (section === "custom-fields") return (
    <>
      <Select label="Aplica a" value={form.entity || "patient"} onChange={(v) => set("entity", v)} options={[["patient", "Paciente"], ["lead", "Lead"], ["appointment", "Cita"], ["product", "Producto"]]} />
      <Text label="Etiqueta" value={form.label} onChange={(v) => set("label", v)} required />
      <Text label="Clave" value={form.fieldKey} onChange={(v) => set("fieldKey", v)} required />
      <Select label="Tipo" value={form.fieldType || "text"} onChange={(v) => set("fieldType", v)} options={[["text", "Texto"], ["number", "Número"], ["date", "Fecha"], ["select", "Lista"]]} />
    </>
  );
  if (section === "booking") return (
    <>
      <Text label="Intervalo de cita (min)" value={form.slotIntervalMinutes ?? 15} onChange={(v) => set("slotIntervalMinutes", Number(v))} />
      <Text label="Anticipación mínima (horas)" value={form.minAdvanceHours ?? 2} onChange={(v) => set("minAdvanceHours", Number(v))} />
      <Text label="Anticipación máxima (días)" value={form.maxAdvanceDays ?? 90} onChange={(v) => set("maxAdvanceDays", Number(v))} />
      <Text label="Ventana para cancelar (horas)" value={form.cancelWindowHours ?? 24} onChange={(v) => set("cancelWindowHours", Number(v))} />
      <Check label="Permitir reprogramar" checked={form.allowReschedule !== false} onChange={(v) => set("allowReschedule", v)} />
      <Check label="Lista de espera" checked={form.allowWaitlist !== false} onChange={(v) => set("allowWaitlist", v)} />
      <Check label="Exigir términos" checked={form.requireTerms !== false} onChange={(v) => set("requireTerms", v)} />
    </>
  );
  return (
    <>
      <label className="admin-field span-2">Política de cancelación<textarea value={String(form.cancellation_policy || "")} onChange={(e) => set("cancellation_policy", e.target.value)} /></label>
      <label className="admin-field span-2">Pie de factura<textarea value={String(form.invoice_footer || "")} onChange={(e) => set("invoice_footer", e.target.value)} /></label>
      <label className="admin-field span-2">Aviso de privacidad<textarea value={String(form.privacy_notice || "")} onChange={(e) => set("privacy_notice", e.target.value)} /></label>
    </>
  );
}

function Text({ label, value, onChange, required }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean }) {
  return <label className="admin-field">{label}<input required={required} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, onChange, options, required }: { label: string; value: unknown; onChange: (value: string) => void; options: string[][]; required?: boolean }) {
  return (
    <label className="admin-field">{label}
      <select required={required} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="admin-check"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}

function payload(section: string, form: Row) {
  if (section === "staff") return { ...form, roles: form.roles || ["reception"] };
  return form;
}

function bookingFrom(row: Row) {
  return {
    slotIntervalMinutes: row.slot_interval_minutes,
    minAdvanceHours: row.min_advance_hours,
    maxAdvanceDays: row.max_advance_days,
    cancelWindowHours: row.cancel_window_hours,
    allowReschedule: row.allow_reschedule,
    allowWaitlist: row.allow_waitlist,
    requireTerms: row.require_terms,
  };
}

function formFrom(section: string, row: Row): Row {
  if (section === "locations") return { name: row.name, timezone: row.timezone, street: row.street, city: row.city, state: row.state, country: row.country, postalCode: row.postal_code, phone: row.phone, email: row.email };
  if (section === "rooms") return { locationId: row.location_id, name: row.name, color: row.color, capacity: row.capacity };
  if (section === "services") return { name: row.name, categoryId: row.category_id, durationMinutes: row.duration_minutes, price: row.price, taxId: row.tax_id, description: row.description, isOnlineBookable: row.is_online_bookable };
  if (section === "staff") return { firstName: row.first_name, lastName: row.last_name, email: row.email, jobTitle: row.job_title, phone: row.phone, defaultLocationId: row.default_location_id, isBookable: row.is_bookable, roles: row.roles };
  if (section === "schedules") return { staffUserId: row.staff_user_id, locationId: row.location_id, dayOfWeek: row.day_of_week, startTime: String(row.start_time || "").slice(0, 5), endTime: String(row.end_time || "").slice(0, 5) };
  if (section === "taxes") return { name: row.name, rate: row.rate, isDefault: row.is_default };
  if (section === "payment-methods") return { key: row.key, name: row.name, isActive: row.is_active };
  if (section === "custom-fields") return { entity: row.entity, label: row.label, fieldKey: row.field_key, fieldType: row.field_type };
  return { name: row.name };
}

function labelOf(section: string, row: Row) {
  if (section === "staff") return `${row.first_name} ${row.last_name}`;
  if (section === "schedules") return `${DAYS[Number(row.day_of_week)] || "Día"} ${String(row.start_time || "").slice(0, 5)}–${String(row.end_time || "").slice(0, 5)}`;
  return String(row.name || row.key || row.label || "Registro");
}

function detailOf(section: string, row: Row) {
  if (section === "locations") return [row.city, row.phone].filter(Boolean).join(" · ") || "Sede";
  if (section === "services") return `${row.duration_minutes || "—"} min · $${Number(row.price || 0).toFixed(2)}`;
  if (section === "staff") return `${row.email} · ${(Array.isArray(row.roles) ? row.roles : []).join(", ") || "sin rol"}`;
  if (section === "taxes") return `${row.rate}%`;
  if (section === "payment-methods") return String(row.key || "");
  return String(row.email || row.city || row.entity || "");
}
