"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/components/admin/clinic/client";
import { countryCode, useClinicScope } from "@/components/admin/clinic/ClinicScope";
import { Button, CloseButton, EmptyState, Tabs, Toast } from "@/components/admin/ui";

type Patient = Record<string, unknown> & { id: string; firstName: string; lastName: string; clientCode: string; email?: string; mobile?: string };

const EMPTY = {
  firstName: "", lastName: "", salutation: "", sex: "", birthDate: "", preferredLanguage: "es",
  email: "", mobile: "", phone: "", street: "", city: "", state: "", country: "", postalCode: "",
  referredByName: "", privacyPolicyStatus: "sin_respuesta", locationId: "", ownerStaffId: "", marketingSourceId: "",
  consentSms: false, consentEmail: false, consentPhone: false, consentPostal: false,
};

export function PatientList({ startNew, initialQuery = "", initialNotice = null }: { startNew?: boolean; initialQuery?: string; initialNotice?: string | null }) {
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(startNew || false);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [section, setSection] = useState("identidad");
  const [attempted, setAttempted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hits, setHits] = useState<Patient[]>([]);
  const [palette, setPalette] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const scope = useClinicScope();
  const [options, setOptions] = useState<{ locations: { id: string; name: string }[]; staff: { id: string; first_name: string; last_name: string }[]; sources: { id: string; name: string }[]; fields: { id: string; label: string; field_type: string; is_required?: boolean }[] }>({ locations: [], staff: [], sources: [], fields: [] });
  const tabs = [["identidad", "Datos"], ["contacto", "Contacto"], ["direccion", "Dirección"], ["consentimiento", "Consentimientos"]] as const;

  async function load(nextPage = page, query = q) {
    const data = await api<{ rows: Patient[]; total: number }>(`/api/admin/patients?q=${encodeURIComponent(query)}&page=${nextPage}&${scope.query}`);
    setRows(data.rows);
    setTotal(data.total);
  }
  useEffect(() => {
    setQ(initialQuery);
    load(1, initialQuery).catch((e) => setError(e.message));
    Promise.all([
      api<{ rows: { id: string; name: string; country?: string | null }[] }>("/api/admin/settings/locations"),
      api<{ rows: { id: string; first_name: string; last_name: string }[] }>("/api/admin/settings/staff"),
      api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/marketing-sources"),
      api<{ rows: { id: string; label: string; field_type: string; entity: string; is_required?: boolean }[] }>("/api/admin/settings/custom-fields"),
    ]).then(([locations, staff, sources, fields]) => setOptions({
      locations: locations.rows.filter((row) => countryCode(row.country) === scope.country),
      staff: staff.rows,
      sources: sources.rows,
      fields: fields.rows.filter((row) => row.entity === "patient"),
    })).catch(() => undefined);
  }, [initialQuery, scope.query]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setPalette(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const timer = setTimeout(() => {
      api<{ rows: Patient[] }>(`/api/admin/patients?q=${encodeURIComponent(q)}&pageSize=8&${scope.query}`)
        .then((result) => setHits(result.rows))
        .catch(() => setHits([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [q, scope.query]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!String(form.firstName || "").trim() || !String(form.lastName || "").trim()) {
      setSection("identidad");
      setError("Nombre y apellido son obligatorios.");
      return;
    }
    try {
      const customFields = options.fields.map((field) => ({ fieldId: field.id, value: form[`cf_${field.id}`] ?? "" }));
      const created = await api<{ patient: { id: string } }>("/api/admin/patients", { method: "POST", body: JSON.stringify({ ...form, customFields }) });
      setOpen(false);
      setForm(EMPTY);
      setSection("identidad");
      setAttempted(false);
      setError(null);
      setToast(created.patient.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Directorio · {scope.label}</p><h1 className="admin-header__title">Pacientes</h1></header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div className="admin-toolbar" data-tour="patients-tools">
        <div className="admin-patient-search">
          <input ref={searchRef} value={q} placeholder="Buscar nombre, código, email o teléfono (Ctrl+K)" onChange={(e) => { setQ(e.target.value); setPalette(true); }} onFocus={() => setPalette(true)} onKeyDown={(e) => { if (e.key === "Enter") { setPalette(false); setPage(1); load(1, q); } if (e.key === "Escape") setPalette(false); }} />
          {palette && q.trim().length >= 2 ? (
            <div className="admin-palette" role="listbox">
              {hits.map((hit) => (
                <button key={hit.id} type="button" onClick={() => { setPalette(false); router.push(`/admin/pacientes/${hit.id}`); }}>
                  {hit.firstName} {hit.lastName}<span>{hit.clientCode}</span>
                </button>
              ))}
              {!hits.length ? <p>Sin coincidencias</p> : null}
            </div>
          ) : null}
        </div>
        <button className="admin-btn" type="button" onClick={() => { setPalette(false); setPage(1); load(1, q); }}>Buscar</button>
        <button className="admin-btn admin-btn--primary" type="button" data-tour="patients-new" onClick={() => { setForm({ ...EMPTY, locationId: scope.locationId || scope.visible[0]?.id || "" }); setOpen(true); }}>+ Paciente</button>
      </div>
      <div className="admin-table-wrap" data-tour="patients-list">
        <div className="admin-table__row admin-table__head" style={{ gridTemplateColumns: "minmax(0,1fr) 8rem" }}><span>Paciente</span><span>Acciones</span></div>
        {rows.map((row) => (
          <div key={row.id} className="admin-table__row" style={{ gridTemplateColumns: "minmax(0,1fr) 8rem" }}>
            <Link href={`/admin/pacientes/${row.id}`}>
              <div className="admin-table__cell-title">{row.firstName} {row.lastName}</div>
              <div className="admin-table__cell-sub">{row.clientCode} · {row.email || "sin email"} · {row.mobile || ""}</div>
            </Link>
            <details className="admin-menu">
              <summary aria-label="Acciones">⋯</summary>
              <div className="admin-menu__list">
            <button type="button" onClick={async () => {
              if (!window.confirm(`¿Archivar a ${row.firstName} ${row.lastName}? El expediente se conserva, pero dejará de aparecer en la lista.`)) return;
              try {
                await api(`/api/admin/patients/${row.id}`, { method: "DELETE" });
                setNotice("Paciente archivado. El expediente se conserva.");
                setError(null);
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo archivar el paciente.");
              }
            }}>Archivar</button>
              </div>
            </details>
          </div>
        ))}
        {!rows.length ? <EmptyState title={q ? "Sin coincidencias" : "Aún no hay pacientes"} text={q ? "Ningún paciente coincide con la búsqueda." : "Crea el primero para empezar el directorio."} action={<button className="admin-btn admin-btn--primary" type="button" onClick={() => setOpen(true)}>+ Paciente</button>} /> : null}
      </div>
      <div className="admin-toolbar">
        <button className="admin-btn" type="button" disabled={page <= 1} onClick={() => { const n = page - 1; setPage(n); load(n); }}>Anterior</button>
        <span>{page} / {Math.max(1, Math.ceil(total / 25))}</span>
        <button className="admin-btn" type="button" disabled={page * 25 >= total} onClick={() => { const n = page + 1; setPage(n); load(n); }}>Siguiente</button>
      </div>
      {open ? (
        <div className="admin-drawer" onClick={() => setOpen(false)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="admin-drawer__head">
              <h2 className="admin-header__title" style={{ margin: 0, fontSize: "1.35rem" }}>Nuevo paciente</h2>
              <CloseButton onClick={() => setOpen(false)} />
            </div>
            <div className="admin-drawer__body">
              {error ? <div className="admin-alert" role="alert">{error}</div> : null}
              <Tabs
                tour="patient-tabs"
                label="Secciones del paciente"
                value={section}
                onChange={setSection}
                items={tabs.map(([id, label]) => ({ id, label }))}
                errors={attempted ? { identidad: !String(form.firstName || "").trim() || !String(form.lastName || "").trim() } : {}}
              />
              <PatientFields form={form} setForm={setForm} options={options} section={section} />
            </div>
            <div className="admin-drawer__foot" data-tour="patient-save">
              <Button type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              {section !== "consentimiento" ? (
                <Button type="button" onClick={() => setSection(tabs[tabs.findIndex((item) => item[0] === section) + 1][0])}>Siguiente</Button>
              ) : null}
              <Button variant="primary" type="submit">Guardar paciente</Button>
            </div>
          </form>
        </div>
      ) : null}
      {toast ? <Toast message="Paciente creado" href={`/admin/pacientes/${toast}`} onClose={() => setToast(null)} /> : null}
    </>
  );
}

export function PatientFields({ form, setForm, options, section = "identidad" }: { form: Record<string, unknown>; setForm: (v: Record<string, unknown>) => void; options: { locations: { id: string; name: string }[]; staff: { id: string; first_name: string; last_name: string }[]; sources: { id: string; name: string }[]; fields?: { id: string; label: string; field_type: string; is_required?: boolean }[] }; section?: string }) {
  const set = (key: string, value: unknown) => setForm({ ...form, [key]: value });
  return (
    <div className="admin-form-grid" style={{ margin: "1rem 0" }}>
      {section === "identidad" ? (
        <div className="span-2">
          <div className="admin-patient-row admin-patient-row--3">
            <label className="admin-field"><span className="admin-field__label">Saludo</span><select value={String(form.salutation || "")} onChange={(e) => set("salutation", e.target.value)}><option value="">ninguno</option><option>Sr.</option><option>Sra.</option><option>Srta.</option><option>Dr.</option><option>Dra.</option></select></label>
            <label className="admin-field"><span className="admin-field__label">Nombre<span className="admin-req"> *</span></span><input required value={String(form.firstName || "")} onChange={(e) => set("firstName", e.target.value)} /></label>
            <label className="admin-field"><span className="admin-field__label">Apellido<span className="admin-req"> *</span></span><input required value={String(form.lastName || "")} onChange={(e) => set("lastName", e.target.value)} /></label>
          </div>
          <div className="admin-patient-row admin-patient-row--2">
            <label className="admin-field"><span className="admin-field__label">Sexo</span><select value={String(form.sex || "")} onChange={(e) => set("sex", e.target.value)}><option value="">—</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="otro">Otro</option></select></label>
            <label className="admin-field"><span className="admin-field__label">Nacimiento</span><input type="date" value={String(form.birthDate || "").slice(0, 10)} onChange={(e) => set("birthDate", e.target.value)} /></label>
          </div>
          <div className="admin-patient-row admin-patient-row--2">
            <label className="admin-field"><span className="admin-field__label">Idioma</span><select value={String(form.preferredLanguage || "es")} onChange={(e) => set("preferredLanguage", e.target.value)}><option value="es">Español</option><option value="en">Inglés</option></select></label>
            <label className="admin-field"><span className="admin-field__label">Sede</span><select value={String(form.locationId || "")} onChange={(e) => set("locationId", e.target.value)}><option value="">—</option>{options.locations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          </div>
          <div className="admin-patient-row admin-patient-row--1">
            <label className="admin-field"><span className="admin-field__label">Responsable</span><select value={String(form.ownerStaffId || "")} onChange={(e) => set("ownerStaffId", e.target.value)}><option value="">—</option>{options.staff.map((o) => <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>)}</select></label>
          </div>
        </div>
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
          {(options.fields || []).map((field) => (
            <label key={field.id} className="admin-field">
              <span className="admin-field__label">{field.label}{field.is_required ? <span className="admin-req"> *</span> : null}</span>
              <input required={Boolean(field.is_required)} type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"} value={String(form[`cf_${field.id}`] || "")} onChange={(e) => set(`cf_${field.id}`, e.target.value)} />
            </label>
          ))}
        </>
      ) : null}
    </div>
  );
}

const TABS = [
  ["resumen", "Resumen"],
  ["citas", "Citas"],
  ["expediente", "Expediente"],
  ["finanzas", "Finanzas"],
  ["comunicaciones", "Comunicaciones"],
  ["membresias", "Membresías"],
] as const;

const TAB_ALIAS: Record<string, string> = {
  ventas: "finanzas",
  formularios: "expediente",
  alergias: "expediente",
  fotos: "expediente",
  documentos: "expediente",
};

export function PatientChart({ id, tab }: { id: string; tab: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [note, setNote] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"allergies" | "conditions" | "medications">("allergies");
  const [clinical, setClinical] = useState<Record<string, Record<string, unknown>[]>>({});
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [folder, setFolder] = useState(tab === "formularios" || tab === "alergias" || tab === "fotos" || tab === "documentos" ? tab : "notas");
  const active = TAB_ALIAS[tab] || tab || "resumen";

  useEffect(() => {
    if (params.get("creado") === "1") setNotice("Paciente guardado.");
  }, [params]);

  useEffect(() => {
    api<{ patient: Patient }>(`/api/admin/patients/${id}`).then((r) => setPatient(r.patient)).catch((e) => setError(e.message));
    api<{ rows: { id: string; name: string }[] }>("/api/admin/forms").then((r) => setTemplates(r.rows)).catch(() => undefined);
  }, [id]);
  useEffect(() => {
    if (active === "expediente" && folder === "alergias") {
      Promise.all(["allergies", "conditions", "medications"].map((name) => api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${name}`).then((r) => [name, r.rows] as const))).then((pairs) => {
        setClinical(Object.fromEntries(pairs));
      }).catch((e) => setError(e.message));
      return;
    }
    const resource = active === "citas" ? "appointments" : active === "finanzas" ? "sales" : active === "comunicaciones" ? "messages" : active === "membresias" ? "memberships" : active === "expediente" && folder === "notas" ? "notes" : active === "expediente" && folder === "formularios" ? "forms" : active === "expediente" && (folder === "fotos" || folder === "documentos") ? "documents" : "";
    if (!resource) return;
    api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${resource}`).then((r) => setRows(r.rows)).catch((e) => setError(e.message));
  }, [id, active, folder]);

  if (!patient) return <div className="admin-skeleton" />;
  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">{String(patient.clientCode || "")}</p>
        <h1 className="admin-header__title">{patient.firstName} {patient.lastName}</h1>
        <p className="admin-header__desc">Creado {patient.createdAt ? new Date(String(patient.createdAt)).toLocaleString("es-MX") : ""}</p>
        <button className="admin-btn" type="button" data-tour="chart-archive" onClick={async () => {
          if (!window.confirm(`¿Archivar a ${patient.firstName} ${patient.lastName}? El expediente se conserva, pero dejará de aparecer en la lista.`)) return;
          try {
            await api(`/api/admin/patients/${id}`, { method: "DELETE" });
            router.push("/admin/pacientes?archivado=1");
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo archivar el paciente.");
          }
        }}>Archivar</button>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-banner" role="status">{notice}</p> : null}
      <nav className="admin-tabs" data-tour="chart-tabs" aria-label="Ficha del paciente">
        {TABS.map(([item, label]) => <Link key={item} className={active === item ? "is-active" : ""} href={item === "resumen" ? `/admin/pacientes/${id}` : `/admin/pacientes/${id}/${item}`}>{label}</Link>)}
      </nav>
      <div data-tour="chart-panel">
      {active === "resumen" ? <PatientSummary patient={patient} /> : null}
      {active === "expediente" ? (
        <>
          <nav className="admin-tabs" aria-label="Secciones del expediente">
            {[["notas", "Notas"], ["alergias", "Alergias"], ["formularios", "Formularios"], ["fotos", "Fotos"], ["documentos", "Documentos"]].map(([item, label]) => (
              <button key={item} type="button" className={folder === item ? "is-active" : ""} onClick={() => setFolder(item)}>{label}</button>
            ))}
          </nav>
          {folder === "notas" ? (
            <form className="admin-form-grid" onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/patients/${id}/notes`, { method: "POST", body: JSON.stringify({ ...note, lock: true }) }); setNotice("Nota guardada."); location.reload(); }}>
              <label className="admin-field">Subjetivo<textarea value={note.subjective} onChange={(e) => setNote({ ...note, subjective: e.target.value })} /></label>
              <label className="admin-field">Objetivo<textarea value={note.objective} onChange={(e) => setNote({ ...note, objective: e.target.value })} /></label>
              <label className="admin-field">Evaluación<textarea value={note.assessment} onChange={(e) => setNote({ ...note, assessment: e.target.value })} /></label>
              <label className="admin-field">Plan<textarea value={note.plan} onChange={(e) => setNote({ ...note, plan: e.target.value })} /></label>
              <button className="admin-btn admin-btn--primary" type="submit">Firmar nota SOAP</button>
              {rows.map((row) => <article key={String(row.id)} className="admin-metric span-2"><p>{String(row.subjective || row.body || "")}</p><p className="admin-metric__label">{row.lockedAt ? "Firmada" : "Borrador"} · {String(row.authorName || "")}</p></article>)}
            </form>
          ) : null}
          {folder === "alergias" ? (
            <form onSubmit={async (e) => { e.preventDefault(); await api(`/api/admin/patients/${id}/${kind}`, { method: "POST", body: JSON.stringify({ value }) }); setNotice("Registro guardado."); location.reload(); }}>
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
          {folder === "formularios" ? (
            <div className="admin-table-wrap">
              <form className="admin-toolbar" onSubmit={async (e) => {
                e.preventDefault();
                await api("/api/admin/forms", { method: "POST", body: JSON.stringify({ action: "assign", templateId, patientId: id }) });
                setNotice("Formulario asignado. El paciente puede abrirlo desde el enlace del portal.");
                const next = await api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/forms`);
                setRows(next.rows);
              }}>
                <select required value={templateId} onChange={(e) => setTemplateId(e.target.value)}><option value="">Plantilla</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <button className="admin-btn admin-btn--primary" type="submit">Asignar</button>
              </form>
              {rows.map((row) => <div key={String(row.id)} className="admin-table__row"><div className="admin-table__cell-title">{String(row.name || "Formulario")}</div><div className="admin-table__cell-sub">{String(row.status || "")}</div></div>)}
              {!rows.length ? <div className="admin-table__empty">Sin formularios.</div> : null}
            </div>
          ) : null}
          {(folder === "fotos" || folder === "documentos") ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              if (folder === "fotos") data.set("isPhoto", "1");
              await api(`/api/admin/patients/${id}/documents`, { method: "POST", body: data });
              setNotice("Archivo guardado.");
              location.reload();
            }}>
              <div className="admin-toolbar"><input name="title" placeholder="Título" /><input name="file" type="file" required /><button className="admin-btn admin-btn--primary" type="submit">Subir</button></div>
              {rows.filter((row) => folder === "fotos" ? row.is_photo : !row.is_photo).map((row) => <a key={String(row.id)} className="admin-table__row" href={`/api/admin/documents/${row.id}`}>{String(row.title)}</a>)}
            </form>
          ) : null}
        </>
      ) : null}
      {active === "citas" ? (
        <div className="admin-table-wrap">
          {rows.map((row) => (
            <div key={String(row.id)} className="admin-table__row">
              <div>
                <div className="admin-table__cell-title">{String(row.serviceName || "Cita")}</div>
                <div className="admin-table__cell-sub">{row.startsAt ? new Date(String(row.startsAt)).toLocaleString("es-MX") : ""} · {row.status === "cancelled" ? "Cancelada" : String(row.status || "")}</div>
              </div>
              {row.status !== "cancelled" ? <button className="admin-btn" type="button" onClick={async () => {
                if (!window.confirm("¿Archivar esta cita? Quedará cancelada y seguirá en el expediente.")) return;
                try {
                  await api(`/api/admin/appointments/${row.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled", cancelReason: "Archivada desde el expediente" }) });
                  setNotice("Cita archivada.");
                  setRows(rows.map((item) => item.id === row.id ? { ...item, status: "cancelled" } : item));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo archivar la cita.");
                }
              }}>Archivar</button> : null}
            </div>
          ))}
          {!rows.length ? <div className="admin-table__empty">Sin citas.</div> : null}
        </div>
      ) : null}
      {active === "finanzas" ? (
        <div className="admin-table-wrap">
          {rows.map((row) => (
            <div key={String(row.id)} className="admin-table__row">
              <div>
                <div className="admin-table__cell-title">{String(row.sale_number || "Venta")}</div>
                <div className="admin-table__cell-sub">{row.status === "void" ? "Anulada" : String(row.status || "")} · ${Number(row.total || 0).toFixed(2)}</div>
              </div>
              {row.status !== "void" ? <button className="admin-btn admin-btn--danger" type="button" onClick={async () => {
                if (!window.confirm("¿Anular esta venta? El registro se conserva, pero deja de contar como cobro.")) return;
                try {
                  await api(`/api/admin/sales/${row.id}`, { method: "POST", body: JSON.stringify({ action: "void", reason: "Anulada desde el expediente" }) });
                  setNotice("Venta anulada.");
                  setRows(rows.map((item) => item.id === row.id ? { ...item, status: "void" } : item));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo anular la venta.");
                }
              }}>Anular</button> : null}
            </div>
          ))}
          {!rows.length ? <div className="admin-table__empty">Sin ventas.</div> : null}
        </div>
      ) : null}
      {active === "membresias" ? (
        <div className="admin-table-wrap">
          {rows.map((row) => (
            <div key={String(row.id)} className="admin-table__row">
              <div className="admin-table__cell-title">{String(row.name || "Membresía")}</div>
              <div className="admin-table__cell-sub">{String(row.status || "")}{row.current_period_end ? ` · hasta ${String(row.current_period_end).slice(0, 10)}` : ""}</div>
            </div>
          ))}
          {!rows.length ? <div className="admin-table__empty">Sin membresías.</div> : null}
        </div>
      ) : null}
      {active === "comunicaciones" ? (
        <div className="admin-table-wrap">{rows.map((row) => <div key={String(row.id)} className="admin-table__row"><div className="admin-table__cell-title">{String(row.subject || row.status || "Mensaje")}</div><div className="admin-table__cell-sub">{String(row.sent_at || row.scheduled_for || row.status || "")}</div></div>)}{!rows.length ? <div className="admin-table__empty">Sin comunicaciones.</div> : null}</div>
      ) : null}
      </div>
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
