"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";
import { CloseButton, EmptyState, SegmentedControl } from "@/components/admin/ui";

const GROUPS: [string, [string, string][]][] = [
  ["Clínica", [["sedes", "Sedes"], ["salas", "Salas"], ["horarios", "Horarios"]]],
  ["Servicios", [["servicios", "Servicios"], ["categorias", "Categorías"]]],
  ["Equipo", [["equipo", "Equipo y roles"]]],
  ["Finanzas", [["impuestos", "Impuestos"], ["pagos", "Métodos de pago"], ["facturacion", "Facturación"]]],
  ["Pacientes", [["campos", "Campos personalizados"], ["politicas", "Políticas"]]],
];
const SECTIONS: [string, string][] = GROUPS.flatMap((group) => group[1]);

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
  const [serviceTab, setServiceTab] = useState("general");
  const [openForm, setOpenForm] = useState(false);
  const [templates, setTemplates] = useState<Row[]>([]);

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
    setOpenForm(false);
    setSaved(false);
    load().catch((e) => setError(e.message));
    api<{ rows: Row[] }>("/api/admin/settings/locations").then((r) => setLocations(r.rows)).catch(() => undefined);
    api<{ rows: Row[] }>("/api/admin/settings/staff").then((r) => setStaff(r.rows)).catch(() => undefined);
    api<{ rows: Row[] }>("/api/admin/settings/service-categories").then((r) => setCategories(r.rows)).catch(() => undefined);
    api<{ rows: Row[] }>("/api/admin/settings/taxes").then((r) => setTaxes(r.rows)).catch(() => undefined);
    if (apiSection === "services") api<{ rows: Row[] }>("/api/admin/forms").then((r) => setTemplates(r.rows)).catch(() => undefined);
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
      setOpenForm(false);
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  const title = SECTIONS.find((item) => item[0] === section)?.[1] || "Configuración";
  const singleton = apiSection === "booking" || apiSection === "clinic";
  const columns = tableColumns(apiSection);
  const recordName = String(form.name || form.label || form.firstName || "");

  useEffect(() => {
    if (!openForm) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenForm(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openForm]);

  function openNew() {
    setEditing(null);
    setForm({});
    setServiceTab("general");
    setOpenForm(true);
  }

  function openEdit(row: Row) {
    setEditing(String(row.id));
    setServiceTab("general");
    setForm(formFrom(apiSection, row));
    setOpenForm(true);
  }

  const editor = (
    <form id="settings-editor" className="admin-form-grid" onSubmit={submit}>
      {apiSection === "services" ? (
        <div className="span-2">
          <SegmentedControl
            label="Secciones del servicio"
            value={serviceTab}
            onChange={setServiceTab}
            items={[["general", "General"], ["precios", "Precios"], ["reserva", "Reserva en línea"], ["formularios", "Formularios"]].map(([id, label]) => ({ id, label }))}
          />
        </div>
      ) : null}
      <Fields section={apiSection} form={form} set={set} locations={locations} staff={staff} categories={categories} taxes={taxes} templates={templates} serviceTab={serviceTab} editing={Boolean(editing)} />
    </form>
  );

  return (
    <div className="admin-settings">
      <nav className="admin-settings__nav" aria-label="Secciones de configuración">
        {GROUPS.map(([group, items]) => (
          <div key={group} className="admin-settings__group">
            <p className="admin-settings__label">{group}</p>
            {items.map(([id, label]) => (
              <Link key={id} className={section === id ? "is-active" : ""} href={`/admin/configuracion/${id}`}>{label}</Link>
            ))}
          </div>
        ))}
      </nav>
      <div>
        <p className="admin-crumb">
          <Link href="/admin/configuracion/sedes">Configuración</Link>
          {" › "}
          <Link href={`/admin/configuracion/${section}`}>{title}</Link>
          {openForm && recordName ? ` › ${recordName}` : null}
        </p>
        <header className="admin-header">
          <h1 className="admin-header__title">{title}</h1>
        </header>
        {error ? <div className="admin-alert" role="alert">{error}</div> : null}
        {saved ? <p className="admin-notice" role="status">Cambios guardados.</p> : null}
        {singleton ? (
          <section className="admin-card">
            {editor}
            <div className="admin-drawer__foot" style={{ marginTop: "1rem", padding: 0, border: 0 }}>
              <button className="admin-btn admin-btn--primary" type="submit" form="settings-editor">Guardar</button>
            </div>
          </section>
        ) : (
          <>
            <div className="admin-page-head">
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
              <button className="admin-btn admin-btn--primary" type="button" onClick={openNew}>+ Nuevo</button>
            </div>
            <div className="admin-table-wrap">
              <div className="admin-table__row admin-table__head" style={{ gridTemplateColumns: columns.template }}>
                {columns.labels.map((label) => <span key={label}>{label}</span>)}
              </div>
              {rows.map((row) => (
                <div key={String(row.id)} className="admin-table__row" style={{ gridTemplateColumns: columns.template }}>
                  {cellsOf(apiSection, row, categories).map((cell, index) => <div key={index}>{cell}</div>)}
                  <details className="admin-menu">
                    <summary aria-label="Acciones">⋯</summary>
                    <div className="admin-menu__list">
                      <button type="button" onClick={() => openEdit(row)}>Editar</button>
                      <button type="button" onClick={async () => {
                        if (!window.confirm(`¿Archivar «${labelOf(apiSection, row)}»?`)) return;
                        await api(`/api/admin/settings/${apiSection}/${row.id}`, { method: "DELETE" });
                        await load();
                      }}>Archivar</button>
                    </div>
                  </details>
                </div>
              ))}
              {!rows.length ? <EmptyState title="Sin registros" text="Crea el primero con + Nuevo." action={<button className="admin-btn admin-btn--primary" type="button" onClick={openNew}>+ Nuevo</button>} /> : null}
            </div>
          </>
        )}
      </div>
      {openForm ? (
        <div className="admin-drawer" onClick={() => setOpenForm(false)}>
          <div className="admin-drawer__panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer__head">
              <h2 className="admin-header__title" style={{ margin: 0, fontSize: "1.25rem" }}>
                {apiSection === "services" && editing ? `Editar servicio: ${recordName || "servicio"}` : editing ? `Editar ${title.toLowerCase()}` : `Nuevo: ${title.toLowerCase()}`}
              </h2>
              <CloseButton onClick={() => setOpenForm(false)} />
            </div>
            <div className="admin-drawer__body">{editor}</div>
            <div className="admin-drawer__foot">
              <button className="admin-btn" type="button" onClick={() => setOpenForm(false)}>Cancelar</button>
              <button className="admin-btn admin-btn--primary" type="submit" form="settings-editor">Guardar</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Fields({ section, form, set, locations, staff, categories, taxes, templates, serviceTab, editing }: {
  section: string;
  form: Row;
  set: (key: string, value: unknown) => void;
  locations: Row[];
  staff: Row[];
  categories: Row[];
  taxes: Row[];
  templates: Row[];
  serviceTab: string;
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
      {serviceTab === "general" ? (
        <>
          <Text label="Nombre" value={form.name} onChange={(v) => set("name", v)} required />
          <Select label="Categoría" value={form.categoryId} onChange={(v) => set("categoryId", v)} options={categories.map((row) => [String(row.id), String(row.name)])} />
          <Text label="Duración (min)" value={form.durationMinutes || "60"} onChange={(v) => set("durationMinutes", Number(v))} />
          <Text label="Descripción" value={form.description} onChange={(v) => set("description", v)} />
        </>
      ) : null}
      {serviceTab === "precios" ? (
        <>
          <Text label="Precio" value={form.price || ""} onChange={(v) => set("price", v === "" ? "" : Number(v))} />
          <Select label="Impuesto" value={form.taxId} onChange={(v) => set("taxId", v)} options={taxes.map((row) => [String(row.id), String(row.name)])} />
          <Text label="Depósito" value={form.depositAmount || ""} onChange={(v) => set("depositAmount", v === "" ? "" : Number(v))} />
        </>
      ) : null}
      {serviceTab === "reserva" ? (
        <>
          <Check label="Se puede reservar en línea" checked={form.isOnlineBookable !== false} onChange={(v) => set("isOnlineBookable", v)} />
          <Text label="Margen antes (min)" value={form.bufferBeforeMinutes || "0"} onChange={(v) => set("bufferBeforeMinutes", Number(v))} />
          <Text label="Margen después (min)" value={form.bufferAfterMinutes || "0"} onChange={(v) => set("bufferAfterMinutes", Number(v))} />
        </>
      ) : null}
      {serviceTab === "formularios" ? (
        <Select label="Formulario requerido" value={form.requiredFormTemplateId} onChange={(v) => set("requiredFormTemplateId", v)} options={templates.map((row) => [String(row.id), String(row.name)])} />
      ) : null}
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
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}{required ? <span className="admin-req"> *</span> : null}</span>
      <input required={required} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options, required }: { label: string; value: unknown; onChange: (value: string) => void; options: string[][]; required?: boolean }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}{required ? <span className="admin-req"> *</span> : null}</span>
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
  if (section === "services") return { name: row.name, categoryId: row.category_id, durationMinutes: row.duration_minutes, price: row.price, taxId: row.tax_id, description: row.description, isOnlineBookable: row.is_online_bookable, depositAmount: row.deposit_amount, bufferBeforeMinutes: row.buffer_before_minutes, bufferAfterMinutes: row.buffer_after_minutes, requiredFormTemplateId: row.required_form_template_id };
  if (section === "staff") return { firstName: row.first_name, lastName: row.last_name, email: row.email, jobTitle: row.job_title, phone: row.phone, defaultLocationId: row.default_location_id, isBookable: row.is_bookable, roles: row.roles };
  if (section === "schedules") return { staffUserId: row.staff_user_id, locationId: row.location_id, dayOfWeek: row.day_of_week, startTime: String(row.start_time || "").slice(0, 5), endTime: String(row.end_time || "").slice(0, 5) };
  if (section === "taxes") return { name: row.name, rate: row.rate, isDefault: row.is_default };
  if (section === "payment-methods") return { key: row.key, name: row.name, isActive: row.is_active };
  if (section === "custom-fields") return { entity: row.entity, label: row.label, fieldKey: row.field_key, fieldType: row.field_type };
  return { name: row.name };
}

function tableColumns(section: string) {
  if (section === "services") return { labels: ["Nombre", "Duración", "Precio", "Categoría", "Acciones"], template: "minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1fr) 4.5rem" };
  if (section === "staff") return { labels: ["Nombre", "Email", "Rol", "Acciones"], template: "minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,1fr) 4.5rem" };
  return { labels: ["Nombre", "Detalle", "Acciones"], template: "minmax(0,1.4fr) minmax(0,1fr) 4.5rem" };
}

function cellsOf(section: string, row: Row, categories: Row[]) {
  if (section === "services") {
    const category = categories.find((item) => item.id === row.category_id);
    return [String(row.name || ""), `${row.duration_minutes || "—"} min`, `$${Number(row.price || 0).toFixed(2)}`, String(category?.name || "—")];
  }
  if (section === "staff") return [`${row.first_name} ${row.last_name}`, String(row.email || "—"), (Array.isArray(row.roles) ? row.roles : []).join(", ") || "sin rol"];
  return [labelOf(section, row), detailOf(section, row) || "—"];
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
