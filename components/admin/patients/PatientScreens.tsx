"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/components/admin/clinic/client";

type Patient = Record<string, unknown> & { id: string; firstName: string; lastName: string; clientCode: string; email?: string; mobile?: string };

const EMPTY = {
  firstName: "", lastName: "", salutation: "", sex: "", birthDate: "", preferredLanguage: "es",
  email: "", mobile: "", phone: "", street: "", city: "", state: "", country: "", postalCode: "",
  referredByName: "", privacyPolicyStatus: "sin_respuesta", locationId: "", ownerStaffId: "", marketingSourceId: "",
  consentSms: false, consentEmail: false, consentPhone: false, consentPostal: false,
};

export function PatientList({ startNew, initialQuery = "" }: { startNew?: boolean; initialQuery?: string }) {
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(startNew || false);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState("identidad");
  const [options, setOptions] = useState<{ locations: { id: string; name: string }[]; staff: { id: string; first_name: string; last_name: string }[]; sources: { id: string; name: string }[] }>({ locations: [], staff: [], sources: [] });
  const router = useRouter();

  async function load(nextPage = page, query = q) {
    const data = await api<{ rows: Patient[]; total: number }>(`/api/admin/patients?q=${encodeURIComponent(query)}&page=${nextPage}`);
    setRows(data.rows);
    setTotal(data.total);
  }
  useEffect(() => {
    setQ(initialQuery);
    load(1, initialQuery).catch((e) => setError(e.message));
    Promise.all([
      api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/locations"),
      api<{ rows: { id: string; first_name: string; last_name: string }[] }>("/api/admin/settings/staff"),
      api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/marketing-sources"),
    ]).then(([locations, staff, sources]) => setOptions({ locations: locations.rows, staff: staff.rows, sources: sources.rows })).catch(() => undefined);
  }, [initialQuery]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await api<{ patient: { id: string } }>("/api/admin/patients", { method: "POST", body: JSON.stringify(form) });
      router.push(`/admin/pacientes/${created.patient.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Directorio</p><h1 className="admin-header__title">Pacientes</h1></header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <div className="admin-toolbar">
        <input value={q} placeholder="Buscar nombre, código, email o teléfono" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(1, q); } }} />
        <button className="admin-btn" type="button" onClick={() => { setPage(1); load(1, q); }}>Buscar</button>
        <button className="admin-btn admin-btn--primary" type="button" onClick={() => setOpen(true)}>+ Paciente</button>
      </div>
      <div className="admin-table-wrap">
        {rows.map((row) => (
          <Link key={row.id} href={`/admin/pacientes/${row.id}`} className="admin-table__row">
            <div><div className="admin-table__cell-title">{row.firstName} {row.lastName}</div><div className="admin-table__cell-sub">{row.clientCode} · {row.email || "sin email"} · {row.mobile || ""}</div></div>
          </Link>
        ))}
        {!rows.length ? <div className="admin-table__empty">{q ? "Ningún paciente coincide con la búsqueda." : "Aún no hay pacientes. Crea el primero con + Paciente."}</div> : null}
      </div>
      <div className="admin-toolbar">
        <button className="admin-btn" type="button" disabled={page <= 1} onClick={() => { const n = page - 1; setPage(n); load(n); }}>Anterior</button>
        <span>{page} / {Math.max(1, Math.ceil(total / 25))}</span>
        <button className="admin-btn" type="button" disabled={page * 25 >= total} onClick={() => { const n = page + 1; setPage(n); load(n); }}>Siguiente</button>
      </div>
      {open ? (
        <div className="admin-drawer" onClick={() => setOpen(false)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="admin-drawer__head"><h2 className="admin-header__title">Nuevo paciente</h2><button className="admin-btn" type="button" onClick={() => setOpen(false)}>Cerrar</button></div>
            {error ? <div className="admin-alert" role="alert">{error}</div> : null}
            <nav className="admin-tabs" aria-label="Secciones del paciente">
              {[["identidad", "Datos"], ["contacto", "Contacto"], ["direccion", "Dirección"], ["consentimiento", "Consentimientos"]].map(([id, label]) => (
                <button key={id} type="button" className={section === id ? "is-active" : ""} onClick={() => setSection(id)}>{label}</button>
              ))}
            </nav>
            <PatientFields form={form} setForm={setForm} options={options} section={section} />
            <button className="admin-btn admin-btn--primary" type="submit">Guardar</button>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function PatientFields({ form, setForm, options, section = "identidad" }: { form: Record<string, unknown>; setForm: (v: Record<string, unknown>) => void; options: { locations: { id: string; name: string }[]; staff: { id: string; first_name: string; last_name: string }[]; sources: { id: string; name: string }[] }; section?: string }) {
  const set = (key: string, value: unknown) => setForm({ ...form, [key]: value });
  return (
    <div className="admin-form-grid" style={{ margin: "1rem 0" }}>
      {section === "identidad" ? (
        <>
          <label className="admin-field">Saludo<input value={String(form.salutation || "")} onChange={(e) => set("salutation", e.target.value)} /></label>
          <label className="admin-field">Nombre*<input required value={String(form.firstName || "")} onChange={(e) => set("firstName", e.target.value)} /></label>
          <label className="admin-field">Apellido*<input required value={String(form.lastName || "")} onChange={(e) => set("lastName", e.target.value)} /></label>
          <label className="admin-field">Sexo<select value={String(form.sex || "")} onChange={(e) => set("sex", e.target.value)}><option value="">—</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="otro">Otro</option></select></label>
          <label className="admin-field">Nacimiento<input type="date" value={String(form.birthDate || "").slice(0, 10)} onChange={(e) => set("birthDate", e.target.value)} /></label>
          <label className="admin-field">Idioma<select value={String(form.preferredLanguage || "es")} onChange={(e) => set("preferredLanguage", e.target.value)}><option value="es">Español</option><option value="en">Inglés</option></select></label>
          <label className="admin-field">Sede<select value={String(form.locationId || "")} onChange={(e) => set("locationId", e.target.value)}><option value="">—</option>{options.locations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          <label className="admin-field">Responsable<select value={String(form.ownerStaffId || "")} onChange={(e) => set("ownerStaffId", e.target.value)}><option value="">—</option>{options.staff.map((o) => <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>)}</select></label>
        </>
      ) : null}
      {section === "contacto" ? (
        <>
          <label className="admin-field">Fuente<select value={String(form.marketingSourceId || "")} onChange={(e) => set("marketingSourceId", e.target.value)}><option value="">—</option>{options.sources.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          <label className="admin-field">Referido por<input value={String(form.referredByName || "")} onChange={(e) => set("referredByName", e.target.value)} /></label>
          <label className="admin-field">Email<input type="email" value={String(form.email || "")} onChange={(e) => set("email", e.target.value)} /></label>
          <label className="admin-field">Móvil<input value={String(form.mobile || "")} onChange={(e) => set("mobile", e.target.value)} /></label>
          <label className="admin-field">Teléfono<input value={String(form.phone || "")} onChange={(e) => set("phone", e.target.value)} /></label>
        </>
      ) : null}
      {section === "direccion" ? (
        <>
          <label className="admin-field span-2">Calle<input value={String(form.street || "")} onChange={(e) => set("street", e.target.value)} /></label>
          <label className="admin-field">Ciudad<input value={String(form.city || "")} onChange={(e) => set("city", e.target.value)} /></label>
          <label className="admin-field">Estado<input value={String(form.state || "")} onChange={(e) => set("state", e.target.value)} /></label>
          <label className="admin-field">País<input value={String(form.country || "")} onChange={(e) => set("country", e.target.value)} /></label>
          <label className="admin-field">Código postal<input value={String(form.postalCode || "")} onChange={(e) => set("postalCode", e.target.value)} /></label>
        </>
      ) : null}
      {section === "consentimiento" ? (
        <>
          <label className="admin-field">Aviso de privacidad<select value={String(form.privacyPolicyStatus || "sin_respuesta")} onChange={(e) => set("privacyPolicyStatus", e.target.value)}><option value="sin_respuesta">Sin respuesta</option><option value="aceptado">Aceptado</option><option value="rechazado">Rechazado</option></select></label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentSms)} onChange={(e) => set("consentSms", e.target.checked)} />SMS</label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentEmail)} onChange={(e) => set("consentEmail", e.target.checked)} />Email</label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentPhone)} onChange={(e) => set("consentPhone", e.target.checked)} />Teléfono</label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentPostal)} onChange={(e) => set("consentPostal", e.target.checked)} />Correo postal</label>
        </>
      ) : null}
    </div>
  );
}

const TABS = [
  ["resumen", "Resumen"],
  ["citas", "Citas"],
  ["expediente", "Expediente"],
  ["formularios", "Formularios"],
  ["alergias", "Alergias"],
  ["fotos", "Fotos"],
  ["documentos", "Documentos"],
  ["ventas", "Ventas"],
  ["comunicaciones", "Comunicaciones"],
] as const;

export function PatientChart({ id, tab }: { id: string; tab: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"allergies" | "conditions" | "medications">("allergies");
  const [clinical, setClinical] = useState<Record<string, Record<string, unknown>[]>>({});
  const active = tab || "resumen";

  useEffect(() => {
    api<{ patient: Patient }>(`/api/admin/patients/${id}`).then((r) => setPatient(r.patient)).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    const resource = active === "citas" ? "appointments" : active === "expediente" ? "notes" : active === "formularios" ? "forms" : active === "alergias" ? "allergies" : active === "fotos" || active === "documentos" ? "documents" : active === "ventas" ? "sales" : active === "comunicaciones" ? "messages" : "";
    if (!resource) return;
    api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${resource}`).then((r) => setRows(r.rows)).catch((e) => setError(e.message));
    if (active === "alergias") {
      Promise.all(["allergies", "conditions", "medications"].map((name) => api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${name}`).then((r) => [name, r.rows] as const))).then((pairs) => {
        setClinical(Object.fromEntries(pairs));
      }).catch((e) => setError(e.message));
    }
  }, [id, active]);

  if (!patient) return <div className="admin-skeleton" />;
  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">{String(patient.clientCode || "")}</p>
        <h1 className="admin-header__title">{patient.firstName} {patient.lastName}</h1>
        <p className="admin-header__desc">Creado {patient.createdAt ? new Date(String(patient.createdAt)).toLocaleString("es-MX") : ""}</p>
      </header>
      {error ? <div className="admin-alert">{error}</div> : null}
      <nav className="admin-tabs">
        {TABS.map(([item, label]) => <Link key={item} className={active === item ? "is-active" : ""} href={item === "resumen" ? `/admin/pacientes/${id}` : `/admin/pacientes/${id}/${item}`}>{label}</Link>)}
      </nav>
      {active === "resumen" ? <PatientSummary patient={patient} /> : null}
      {active === "expediente" ? (
        <form className="admin-form-grid" onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/patients/${id}/notes`, { method: "POST", body: JSON.stringify({ ...note, lock: true }) }); location.reload(); }}>
          <label className="admin-field">Subjetivo<textarea value={note.subjective} onChange={(e) => setNote({ ...note, subjective: e.target.value })} /></label>
          <label className="admin-field">Objetivo<textarea value={note.objective} onChange={(e) => setNote({ ...note, objective: e.target.value })} /></label>
          <label className="admin-field">Evaluación<textarea value={note.assessment} onChange={(e) => setNote({ ...note, assessment: e.target.value })} /></label>
          <label className="admin-field">Plan<textarea value={note.plan} onChange={(e) => setNote({ ...note, plan: e.target.value })} /></label>
          <button className="admin-btn admin-btn--primary" type="submit">Firmar nota SOAP</button>
          {rows.map((row) => <article key={String(row.id)} className="admin-metric span-2"><p>{String(row.subjective || row.body || "")}</p><p className="admin-metric__label">{row.lockedAt ? "Firmada" : "Borrador"} · {String(row.authorName || "")}</p></article>)}
        </form>
      ) : null}
      {active === "alergias" ? (
        <form onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/patients/${id}/${kind}`, { method: "POST", body: JSON.stringify({ value }) }); location.reload(); }}>
          <div className="admin-toolbar">
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="allergies">Alergia</option><option value="conditions">Condición</option><option value="medications">Medicamento</option></select>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Descripción" />
            <button className="admin-btn admin-btn--primary" type="submit">Agregar</button>
          </div>
          {(["allergies", "conditions", "medications"] as const).map((name) => (
            <section key={name}><h2>{name === "allergies" ? "Alergias" : name === "conditions" ? "Condiciones" : "Medicamentos"}</h2>{(clinical[name] || []).map((row) => <div key={String(row.id)} className="admin-table__row">{String(row.value)}</div>)}</section>
          ))}
        </form>
      ) : null}
      {(active === "fotos" || active === "documentos") ? (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          if (active === "fotos") data.set("isPhoto", "1");
          await api(`/api/admin/patients/${id}/documents`, { method: "POST", body: data });
          location.reload();
        }}>
          <div className="admin-toolbar"><input name="title" placeholder="Título" /><input name="file" type="file" required /><button className="admin-btn admin-btn--primary" type="submit">Subir</button></div>
          {rows.filter((row) => active === "fotos" ? row.is_photo : !row.is_photo).map((row) => <a key={String(row.id)} className="admin-table__row" href={`/api/admin/documents/${row.id}`}>{String(row.title)}</a>)}
        </form>
      ) : null}
      {active !== "resumen" && active !== "expediente" && active !== "alergias" && active !== "fotos" && active !== "documentos" ? (
        <div className="admin-table-wrap">{rows.map((row) => <div key={String(row.id)} className="admin-table__row"><div className="admin-table__cell-title">{String(row.serviceName || row.name || row.subject || row.sale_number || row.status || row.id)}</div><div className="admin-table__cell-sub">{String(row.startsAt || row.created_at || row.sentAt || row.status || "")}</div></div>)}{!rows.length ? <div className="admin-table__empty">Sin registros.</div> : null}</div>
      ) : null}
    </>
  );
}

function PatientSummary({ patient }: { patient: Patient }) {
  const address = [patient.street, patient.city, patient.state, patient.postalCode, patient.country].filter(Boolean).join(", ");
  const facts: [string, unknown][] = [
    ["Código", patient.clientCode],
    ["Email", patient.email],
    ["Móvil", patient.mobile],
    ["Teléfono", patient.phone],
    ["Nacimiento", patient.birthDate],
    ["Sexo", patient.sex],
    ["Idioma", patient.preferredLanguage],
    ["Dirección", address],
    ["Aviso de privacidad", patient.privacyPolicyStatus],
    ["SMS", patient.consentSms ? "Autorizado" : "Sin autorización"],
    ["Email comercial", patient.consentEmail ? "Autorizado" : "Sin autorización"],
  ];
  return (
    <dl className="admin-facts">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ? String(value) : "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
