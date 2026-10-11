"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/components/admin/clinic/client";
import { countryCode, useAdminEnglish, useClinicScope } from "@/components/admin/clinic/ClinicScope";
import { Button, CloseButton, EmptyState, Tabs, Toast } from "@/components/admin/ui";
import StoreReceipt from "@/components/store/StoreReceipt";
import { majorToMinor } from "@/lib/square/money";
import type { StoreReceiptData } from "@/lib/store/orderTypes";
import "@/app/styles/tienda.css";

type Patient = Record<string, unknown> & {
  id: string; firstName: string; lastName: string; clientCode: string;
  email?: string; mobile?: string; phone?: string; city?: string; state?: string;
  sex?: string | null; createdAt?: string; marketingSource?: string | null; privacyPolicyStatus?: string;
  tags?: { id?: string; name?: string }[];
};

type Facets = {
  sex: { todos: number; femenino: number; masculino: number; otro: number; sin_dato: number };
  sources: { id: string; name: string; total: number }[];
};

const EMPTY_FACETS: Facets = {
  sex: { todos: 0, femenino: 0, masculino: 0, otro: 0, sin_dato: 0 },
  sources: [],
};

function sexLabel(value: unknown, english = false) {
  const sex = String(value || "").trim().toLowerCase();
  if (sex === "femenino") return english ? "Woman" : "Mujer";
  if (sex === "masculino") return english ? "Man" : "Hombre";
  if (sex === "otro") return english ? "Other designation" : "Otro / otra designación";
  if (sex === "prefiere_no") return english ? "Prefer not to say" : "Prefiere no responder";
  return english ? "No data" : "Sin dato";
}

function privacyLabel(status?: string, english = false) {
  if (status === "aceptado") return english ? "Notice accepted" : "Aviso aceptado";
  if (status === "rechazado") return english ? "Notice declined" : "Aviso rechazado";
  return english ? "Notice unanswered" : "Aviso sin respuesta";
}

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
  const [sex, setSex] = useState("");
  const [source, setSource] = useState("");
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [sort, setSort] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);
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
  const english = scope.country === "US";
  const [options, setOptions] = useState<{ locations: { id: string; name: string }[]; staff: { id: string; first_name: string; last_name: string }[]; sources: { id: string; name: string }[]; fields: { id: string; label: string; field_type: string; is_required?: boolean }[] }>({ locations: [], staff: [], sources: [], fields: [] });
  const tabs = (english
    ? [["identidad", "Details"], ["contacto", "Contact"], ["direccion", "Address"], ["consentimiento", "Consent"]]
    : [["identidad", "Datos"], ["contacto", "Contacto"], ["direccion", "Dirección"], ["consentimiento", "Consentimientos"]]) as [string, string][];

  async function load(nextPage = page, query = q, nextSex = sex, nextSort = sort, nextSource = source) {
    const data = await api<{ rows: Patient[]; total: number; facets?: Facets }>(`/api/admin/patients?q=${encodeURIComponent(query)}&page=${nextPage}&sex=${encodeURIComponent(nextSex)}&source=${encodeURIComponent(nextSource)}&sort=${encodeURIComponent(nextSort)}&${scope.query}`);
    setRows(data.rows);
    setTotal(data.total);
    setFacets(data.facets || EMPTY_FACETS);
  }
  useEffect(() => {
    setQ(initialQuery);
    load(1, initialQuery).catch((e) => setError(e.message));
    Promise.all([
      api<{ rows: { id: string; name: string; country?: string | null; is_active?: boolean }[] }>("/api/admin/settings/locations"),
      api<{ rows: { id: string; first_name: string; last_name: string }[] }>("/api/admin/settings/staff"),
      api<{ rows: { id: string; name: string; is_active?: boolean }[] }>("/api/admin/settings/marketing-sources"),
      api<{ rows: { id: string; label: string; field_type: string; entity: string; is_required?: boolean }[] }>("/api/admin/settings/custom-fields"),
    ]).then(([locations, staff, sources, fields]) => setOptions({
      locations: locations.rows.filter((row) => row.is_active !== false && countryCode(row.country) === scope.country),
      staff: staff.rows,
      sources: sources.rows.filter((row) => row.is_active !== false),
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

  const sexFilters = [
    ["", english ? "All" : "Todos", facets.sex.todos],
    ["femenino", english ? "Women" : "Mujeres", facets.sex.femenino],
    ["masculino", english ? "Men" : "Hombres", facets.sex.masculino],
    ["otro", english ? "Other" : "Otro", facets.sex.otro],
    ["sin_dato", english ? "No data" : "Sin dato", facets.sex.sin_dato],
  ] as const;
  const sourceCounts = new Map(facets.sources.map((row) => [row.id, row.total]));
  const knownSourceIds = new Set(options.sources.map((row) => row.id));
  const sourceFilters = [
    { id: "", name: english ? "All" : "Todas", total: facets.sources.reduce((sum, row) => sum + row.total, 0) },
    ...options.sources.map((row) => ({ id: row.id, name: row.name, total: sourceCounts.get(row.id) ?? 0 })),
    { id: "sin_fuente", name: english ? "No source" : "Sin fuente", total: sourceCounts.get("sin_fuente") ?? 0 },
    ...facets.sources
      .filter((row) => row.id !== "sin_fuente" && !knownSourceIds.has(row.id))
      .map((row) => ({ id: row.id, name: row.name, total: row.total })),
  ];
  const empty = q
    ? { title: english ? "No matches" : "Sin coincidencias", text: english ? "No patient matches the search." : "Ningún paciente coincide con la búsqueda." }
    : sex === "otro" && !source && facets.sex.otro === 0
      ? { title: english ? "Nobody in Other" : "Nadie en Otro", text: english ? "No patient has sex set to Other. Patients without sex are in No data." : "Ningún paciente tiene el sexo Otro. Quienes no tienen sexo guardado están en Sin dato." }
      : sex === "sin_dato" && !source && facets.sex.sin_dato === 0
        ? { title: english ? "Everyone has a sex" : "Todos tienen sexo", text: english ? "In this directory every patient is already Woman, Man, or Other." : "En este directorio cada paciente ya es Mujer, Hombre u Otro." }
        : sex || source
          ? { title: english ? "No matches" : "Sin coincidencias", text: english ? "No patient matches this filter." : "Ningún paciente coincide con este filtro." }
          : { title: english ? "No patients yet" : "Aún no hay pacientes", text: english ? "Create the first one to start the directory." : "Crea el primero para empezar el directorio." };

  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">{english ? "Directory" : "Directorio"} · {scope.label}</p><h1 className="admin-header__title">{english ? "Patients" : "Pacientes"}</h1></header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div className="patient-directory">
      <div className="admin-toolbar" data-tour="patients-tools">
        <div className="admin-patient-search">
          <input ref={searchRef} value={q} placeholder={english ? "Search name, code, email, or phone" : "Buscar nombre, código, email o teléfono"} onChange={(e) => { setQ(e.target.value); setPalette(true); }} onFocus={() => setPalette(true)} onKeyDown={(e) => { if (e.key === "Enter") { setPalette(false); setPage(1); load(1, q); } if (e.key === "Escape") setPalette(false); }} />
          {palette && q.trim().length >= 2 ? (
            <div className="admin-palette" role="listbox">
              {hits.map((hit) => (
                <button key={hit.id} type="button" onClick={() => { setPalette(false); router.push(`/admin/pacientes/${hit.id}`); }}>
                  {hit.firstName} {hit.lastName}<span>{hit.clientCode}</span>
                </button>
              ))}
              {!hits.length ? <p>{english ? "No matches" : "Sin coincidencias"}</p> : null}
            </div>
          ) : null}
        </div>
        <label className="admin-field patient-directory__sort">{english ? "Sort" : "Orden"}
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); load(1, q, sex, e.target.value); }}>
            <option value="name">{english ? "Name" : "Nombre"}</option>
            <option value="recent">{english ? "Most recent" : "Más recientes"}</option>
          </select>
        </label>
        <button className="admin-btn" type="button" onClick={() => { setPalette(false); setPage(1); load(1, q); }}>{english ? "Search" : "Buscar"}</button>
        <button className="admin-btn admin-btn--primary" type="button" data-tour="patients-new" onClick={() => { setForm({ ...EMPTY, locationId: scope.locationId || scope.visible[0]?.id || "" }); setOpen(true); }}>{english ? "+ Patient" : "+ Paciente"}</button>
      </div>
      <div className="patient-directory__body">
      <aside className="patient-filters" aria-label={english ? "Directory filters" : "Filtros del directorio"}>
        <div className="admin-nav__block" role="group" aria-label={english ? "Sex" : "Sexo"}>
          <p className="admin-nav__group">{english ? "Sex" : "Sexo"}</p>
          {sexFilters.map(([id, label, count]) => (
            <button key={id || "all-sex"} type="button" className={`admin-nav__item${sex === id ? " admin-nav__item--active" : ""}`} aria-pressed={sex === id} onClick={() => { setSex(id); setPage(1); load(1, q, id, sort, source); }}>
              <span>{label}</span>
              <span className="patient-filters__count">{count}</span>
            </button>
          ))}
        </div>
        <div className="admin-nav__block" role="group" aria-label={english ? "How they found us" : "Cómo nos descubrieron"}>
          <p className="admin-nav__group">{english ? "How they found us" : "Cómo nos descubrieron"}</p>
          {sourceFilters.map((item) => (
            <button key={item.id || "all-sources"} type="button" className={`admin-nav__item${source === item.id ? " admin-nav__item--active" : ""}`} aria-pressed={source === item.id} onClick={() => { setSource(item.id); setPage(1); load(1, q, sex, sort, item.id); }}>
              <span>{item.name}</span>
              <span className="patient-filters__count">{item.total}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="patient-directory__list">
      <p className="patient-directory__count">{total} {english ? (total === 1 ? "patient" : "patients") : (total === 1 ? "paciente" : "pacientes")}</p>
      <div className="admin-table-wrap" data-tour="patients-list">
        <div className="admin-table__head admin-table__head--patients"><span>{english ? "Patient" : "Paciente"}</span><span>{english ? "Contact" : "Contacto"}</span><span>{english ? "City" : "Ciudad"}</span><span>{english ? "Source" : "Origen"}</span><span>{english ? "Added" : "Alta"}</span><span /></div>
        {rows.map((row) => {
          const tags = Array.isArray(row.tags) ? row.tags as { id?: string; name?: string }[] : [];
          const openRow = expanded === row.id;
          return (
            <div key={row.id} className="patient-directory__item">
              <div className="admin-table__row admin-table__row--patients" onClick={() => router.push(`/admin/pacientes/${row.id}`)}>
                <div className="patient-directory__who">
                  <button type="button" className="patient-directory__toggle" aria-expanded={openRow} aria-label="Ver detalle rápido" onClick={(e) => { e.stopPropagation(); setExpanded(openRow ? null : row.id); }}>
                    <span className={openRow ? "is-open" : ""} aria-hidden="true">›</span>
                  </button>
                  <span>
                    <span className="admin-table__cell-title">{row.firstName} {row.lastName}</span>
                    <span className="admin-table__cell-sub">{sexLabel(row.sex, english)} · {row.clientCode}</span>
                  </span>
                </div>
                <div>
                  <div>{row.email || (english ? "No email" : "Sin email")}</div>
                  <div className="admin-table__cell-sub">{row.mobile || row.phone || (english ? "No phone" : "Sin teléfono")}</div>
                </div>
                <div>{[row.city, row.state].filter(Boolean).join(", ") || "—"}</div>
                <div>{row.marketingSource || (english ? "No source" : "Sin fuente")}</div>
                <div>{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString(english ? "en-US" : "es-MX") : "—"}</div>
                <details className="admin-menu" onClick={(e) => e.stopPropagation()}>
                  <summary aria-label={english ? "Actions" : "Acciones"}>⋯</summary>
                  <div className="admin-menu__list">
                    <Link href={`/admin/pacientes/${row.id}`}>{english ? "Open chart" : "Abrir expediente"}</Link>
                    <button type="button" onClick={async () => {
                      if (!window.confirm(english ? `Archive ${row.firstName} ${row.lastName}? The chart stays, but they leave the list.` : `¿Archivar a ${row.firstName} ${row.lastName}? El expediente se conserva, pero dejará de aparecer en la lista.`)) return;
                      try {
                        await api(`/api/admin/patients/${row.id}`, { method: "DELETE" });
                        setNotice(english ? "Patient archived. The chart stays." : "Paciente archivado. El expediente se conserva.");
                        setError(null);
                        await load();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : (english ? "Could not archive the patient." : "No se pudo archivar el paciente."));
                      }
                    }}>{english ? "Archive" : "Archivar"}</button>
                  </div>
                </details>
              </div>
              {openRow ? (
                <div className="patient-directory__detail">
                  <p>{String(row.marketingSource || (english ? "No source" : "Sin origen"))} · {privacyLabel(row.privacyPolicyStatus, english)}</p>
                  <div className="patient-directory__tags">
                    {tags.length ? tags.map((tag) => <span key={tag.id || tag.name}>{tag.name}</span>) : <span>{english ? "No tags" : "Sin etiquetas"}</span>}
                  </div>
                  <Link href={`/admin/pacientes/${row.id}`}>{english ? "Open chart" : "Abrir expediente"}</Link>
                </div>
              ) : null}
            </div>
          );
        })}
        {!rows.length ? <EmptyState title={empty.title} text={empty.text} action={!q && !sex && !source ? <button className="admin-btn admin-btn--primary" type="button" onClick={() => setOpen(true)}>{english ? "+ Patient" : "+ Paciente"}</button> : undefined} /> : null}
      </div>
      </div>
      </div>
      <div className="admin-toolbar">
        <button className="admin-btn" type="button" disabled={page <= 1} onClick={() => { const n = page - 1; setPage(n); load(n); }}>{english ? "Previous" : "Anterior"}</button>
        <span>{page} / {Math.max(1, Math.ceil(total / 25))}</span>
        <button className="admin-btn" type="button" disabled={page * 25 >= total} onClick={() => { const n = page + 1; setPage(n); load(n); }}>{english ? "Next" : "Siguiente"}</button>
      </div>
      </div>
      {open ? (
        <div className="admin-drawer" onClick={() => setOpen(false)}>
          <form className="admin-drawer__panel" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="admin-drawer__head">
              <h2 className="admin-header__title" style={{ margin: 0, fontSize: "1.35rem" }}>{english ? "New patient" : "Nuevo paciente"}</h2>
              <CloseButton onClick={() => setOpen(false)} />
            </div>
            <div className="admin-drawer__body">
              {error ? <div className="admin-alert" role="alert">{error}</div> : null}
              <Tabs
                tour="patient-tabs"
                label={english ? "Patient sections" : "Secciones del paciente"}
                value={section}
                onChange={setSection}
                items={tabs.map(([id, label]) => ({ id, label }))}
                errors={attempted ? { identidad: !String(form.firstName || "").trim() || !String(form.lastName || "").trim() } : {}}
              />
              <PatientFields form={form} setForm={setForm} options={options} section={section} />
            </div>
            <div className="admin-drawer__foot" data-tour="patient-save">
              <Button type="button" onClick={() => setOpen(false)}>{english ? "Cancel" : "Cancelar"}</Button>
              {section !== "consentimiento" ? (
                <Button type="button" onClick={() => setSection(tabs[tabs.findIndex((item) => item[0] === section) + 1][0])}>{english ? "Next" : "Siguiente"}</Button>
              ) : null}
              <Button variant="primary" type="submit">{english ? "Save patient" : "Guardar paciente"}</Button>
            </div>
          </form>
        </div>
      ) : null}
      {toast ? <Toast message={english ? "Patient created" : "Paciente creado"} href={`/admin/pacientes/${toast}`} hrefLabel={english ? "Open chart" : "Ver ficha"} onClose={() => setToast(null)} /> : null}
    </>
  );
}

export function PatientFields({ form, setForm, options, section = "identidad" }: { form: Record<string, unknown>; setForm: (v: Record<string, unknown>) => void; options: { locations: { id: string; name: string }[]; staff: { id: string; first_name: string; last_name: string }[]; sources: { id: string; name: string }[]; fields?: { id: string; label: string; field_type: string; is_required?: boolean }[] }; section?: string }) {
  const english = useAdminEnglish();
  const set = (key: string, value: unknown) => setForm({ ...form, [key]: value });
  return (
    <div className="admin-form-grid" style={{ margin: "1rem 0" }}>
      {section === "identidad" ? (
        <div className="span-2">
          <div className="admin-patient-row admin-patient-row--3">
            <label className="admin-field"><span className="admin-field__label">{english ? "Title" : "Saludo"}</span><select value={String(form.salutation || "")} onChange={(e) => set("salutation", e.target.value)}><option value="">{english ? "none" : "ninguno"}</option><option>Sr.</option><option>Sra.</option><option>Srta.</option><option>Dr.</option><option>Dra.</option></select></label>
            <label className="admin-field"><span className="admin-field__label">{english ? "First name" : "Nombre"}<span className="admin-req"> *</span></span><input required value={String(form.firstName || "")} onChange={(e) => set("firstName", e.target.value)} /></label>
            <label className="admin-field"><span className="admin-field__label">{english ? "Last name" : "Apellido"}<span className="admin-req"> *</span></span><input required value={String(form.lastName || "")} onChange={(e) => set("lastName", e.target.value)} /></label>
          </div>
          <div className="admin-patient-row admin-patient-row--2">
            <label className="admin-field"><span className="admin-field__label">{english ? "Sex" : "Sexo"}</span><select value={String(form.sex || "")} onChange={(e) => set("sex", e.target.value)}><option value="">—</option><option value="masculino">{english ? "Male" : "Masculino"}</option><option value="femenino">{english ? "Female" : "Femenino"}</option><option value="otro">{english ? "Other designation" : "Otro / otra designación"}</option><option value="prefiere_no">{english ? "Prefer not to say" : "Prefiere no responder"}</option></select></label>
            <label className="admin-field"><span className="admin-field__label">{english ? "Date of birth" : "Nacimiento"}</span><input type="date" value={String(form.birthDate || "").slice(0, 10)} onChange={(e) => set("birthDate", e.target.value)} /></label>
          </div>
          <div className="admin-patient-row admin-patient-row--2">
            <label className="admin-field"><span className="admin-field__label">{english ? "Language" : "Idioma"}</span><select value={String(form.preferredLanguage || "es")} onChange={(e) => set("preferredLanguage", e.target.value)}><option value="es">{english ? "Spanish" : "Español"}</option><option value="en">{english ? "English" : "Inglés"}</option></select></label>
            <label className="admin-field"><span className="admin-field__label">{english ? "Location" : "Sede"}</span><select value={String(form.locationId || "")} onChange={(e) => set("locationId", e.target.value)}><option value="">—</option>{options.locations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          </div>
          <div className="admin-patient-row admin-patient-row--1">
            <label className="admin-field"><span className="admin-field__label">{english ? "Owner" : "Responsable"}</span><select value={String(form.ownerStaffId || "")} onChange={(e) => set("ownerStaffId", e.target.value)}><option value="">—</option>{options.staff.map((o) => <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>)}</select></label>
          </div>
        </div>
      ) : null}
      {section === "contacto" ? (
        <>
          <label className="admin-field"><span className="admin-field__label">{english ? "How they found us" : "Cómo nos descubrieron"}</span><select value={String(form.marketingSourceId || "")} onChange={(e) => set("marketingSourceId", e.target.value)}><option value="">—</option>{options.sources.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          <label className="admin-field">{english ? "Referred by" : "Referido por"}<input value={String(form.referredByName || "")} onChange={(e) => set("referredByName", e.target.value)} /></label>
          <label className="admin-field">Email<input type="email" value={String(form.email || "")} onChange={(e) => set("email", e.target.value)} /></label>
          <label className="admin-field">{english ? "Mobile" : "Móvil"}<input value={String(form.mobile || "")} onChange={(e) => set("mobile", e.target.value)} /></label>
          <label className="admin-field">{english ? "Phone" : "Teléfono"}<input value={String(form.phone || "")} onChange={(e) => set("phone", e.target.value)} /></label>
        </>
      ) : null}
      {section === "direccion" ? (
        <AddressFields form={form} set={set} />
      ) : null}
      {section === "consentimiento" ? (
        <>
          <label className="admin-field">{english ? "Privacy notice" : "Aviso de privacidad"}<select value={String(form.privacyPolicyStatus || "sin_respuesta")} onChange={(e) => set("privacyPolicyStatus", e.target.value)}><option value="sin_respuesta">{english ? "No answer" : "Sin respuesta"}</option><option value="aceptado">{english ? "Accepted" : "Aceptado"}</option><option value="rechazado">{english ? "Declined" : "Rechazado"}</option></select></label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentSms)} onChange={(e) => set("consentSms", e.target.checked)} />SMS</label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentEmail)} onChange={(e) => set("consentEmail", e.target.checked)} />Email</label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentPhone)} onChange={(e) => set("consentPhone", e.target.checked)} />{english ? "Phone" : "Teléfono"}</label>
          <label className="admin-check"><input type="checkbox" checked={Boolean(form.consentPostal)} onChange={(e) => set("consentPostal", e.target.checked)} />{english ? "Mail" : "Correo postal"}</label>
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

function AddressFields({ form, set }: { form: Record<string, unknown>; set: (key: string, value: unknown) => void }) {
  const scope = useClinicScope();
  const us = scope.country === "US";
  return (
    <>
      <label className="admin-field span-2">{us ? "Street" : "Calle"}<input value={String(form.street || "")} onChange={(e) => set("street", e.target.value)} /></label>
      {us ? null : <label className="admin-field">Código postal<input value={String(form.postalCode || "")} onChange={(e) => set("postalCode", e.target.value)} /></label>}
      <label className="admin-field">{us ? "City" : "Ciudad"}<input value={String(form.city || "")} onChange={(e) => set("city", e.target.value)} /></label>
      <label className="admin-field">{us ? "State" : "Estado"}<input value={String(form.state || "")} onChange={(e) => set("state", e.target.value)} /></label>
      {us ? <label className="admin-field">ZIP<input value={String(form.postalCode || "")} onChange={(e) => set("postalCode", e.target.value)} /></label> : null}
      <label className="admin-field">{us ? "Country" : "País"}<input value={String(form.country || "")} onChange={(e) => set("country", e.target.value)} /></label>
    </>
  );
}

const TABS = [
  ["resumen", "Resumen"],
  ["citas", "Citas"],
  ["expediente", "Expediente"],
  ["finanzas", "Compras"],
  ["comunicaciones", "Comunicaciones"],
  ["membresias", "Membresías"],
] as const;

const FOLDERS = [
  ["notas", "Plan de 90 días", "expediente"],
  ["sesiones", "Sesiones", "sesiones"],
  ["estudios", "Estudios clínicos", "estudios"],
  ["alergias", "Alergias", "alergias"],
  ["fotos", "Fotos", "fotos"],
  ["documentos", "Documentos", "documentos"],
] as const;

const STUDIES = [
  ["imaging", "Imagenología"],
  ["labs", "Sangre / orina / saliva"],
  ["microbiota", "Microbiota"],
  ["procedures", "Procedimientos"],
] as const;

const SALE_RECEIPT_LABELS = {
  receiptTitle: "Recibo",
  totalPaid: "Total pagado",
  thanksOrder: "Gracias por tu visita.",
  processingOrder: "Procesando",
  printingReceipt: "Imprimiendo tu recibo",
  orderComplete: "Venta registrada",
  pickup: "Sede",
  shipping: "Sede",
  home: "Ficha",
};

type ClinicSale = {
  sale_number?: string;
  total?: string | number;
  created_at?: string;
  location_name?: string | null;
  items?: { description?: string; quantity?: string | number; unit_price?: string | number }[];
};

function saleToReceipt(sale: ClinicSale, patientName: string): StoreReceiptData {
  const currency = "USD";
  return {
    folio: String(sale.sale_number || ""),
    paidAt: String(sale.created_at || new Date().toISOString()),
    recipientName: patientName,
    fulfillment: "pickup",
    locationName: sale.location_name || null,
    address: null,
    currency,
    totalAmount: majorToMinor(Number(sale.total || 0), currency),
    lines: (sale.items || []).map((item) => ({
      name: String(item.description || "Concepto"),
      variationName: null,
      quantity: Number(item.quantity || 1),
      unitAmount: majorToMinor(Number(item.unit_price || 0), currency),
      currency,
    })),
    locale: "es-MX",
  };
}

const TAB_ALIAS: Record<string, string> = {
  ventas: "finanzas",
  formularios: "expediente",
  estudios: "expediente",
  sesiones: "expediente",
  alergias: "expediente",
  fotos: "expediente",
  documentos: "expediente",
};

export function PatientChart({ id, tab }: { id: string; tab: string }) {
  const english = useAdminEnglish();
  const router = useRouter();
  const params = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sessionDraft, setSessionDraft] = useState({ title: "" });
  const [study, setStudy] = useState<(typeof STUDIES)[number][0]>("imaging");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"allergies" | "conditions" | "medications">("allergies");
  const [clinical, setClinical] = useState<Record<string, Record<string, unknown>[]>>({});
  const [receipt, setReceipt] = useState<StoreReceiptData | null>(null);
  const active = TAB_ALIAS[tab] || tab || "resumen";
  const folder = tab === "formularios" ? "estudios" : tab === "alergias" || tab === "fotos" || tab === "documentos" || tab === "sesiones" || tab === "estudios" ? tab : "notas";
  const folderNames: Record<string, string> = english
    ? { notas: "90-day plan", sesiones: "Sessions", estudios: "Clinical studies", alergias: "Allergies", fotos: "Photos", documentos: "Documents" }
    : { notas: "Plan de 90 días", sesiones: "Sesiones", estudios: "Estudios clínicos", alergias: "Alergias", fotos: "Fotos", documentos: "Documentos" };
  const tabNames: Record<string, string> = english
    ? { resumen: "Summary", citas: "Appointments", expediente: "Chart", finanzas: "Purchases", comunicaciones: "Messages", membresias: "Memberships" }
    : { resumen: "Resumen", citas: "Citas", expediente: "Expediente", finanzas: "Compras", comunicaciones: "Comunicaciones", membresias: "Membresías" };
  const folderLabel = folderNames[folder] || (english ? "90-day plan" : "Plan de 90 días");

  useEffect(() => {
    if (params.get("creado") === "1") setNotice(english ? "Patient saved." : "Paciente guardado.");
  }, [params, english]);

  useEffect(() => {
    api<{ patient: Patient }>(`/api/admin/patients/${id}`).then((r) => setPatient(r.patient)).catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    if (active === "expediente" && folder === "alergias") {
      Promise.all(["allergies", "conditions", "medications"].map((name) => api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${name}`).then((r) => [name, r.rows] as const))).then((pairs) => {
        setClinical(Object.fromEntries(pairs));
      }).catch((e) => setError(e.message));
      return;
    }
    const resource = active === "citas" ? "appointments" : active === "finanzas" ? "sales" : active === "comunicaciones" ? "messages" : active === "membresias" ? "memberships" : active === "expediente" && folder === "notas" ? "notes" : active === "expediente" && folder === "sesiones" ? "sessions" : active === "expediente" && (folder === "fotos" || folder === "documentos" || folder === "estudios") ? "documents" : "";
    if (!resource) return;
    api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${resource}`).then((r) => setRows(r.rows)).catch((e) => setError(e.message));
  }, [id, active, folder]);

  if (!patient) return <div className="admin-skeleton" />;
  return (
    <>
      <header className="admin-header admin-header--chart">
        <div className="admin-header__copy">
          <p className="admin-header__eyebrow">{String(patient.clientCode || "")}</p>
          <h1 className="admin-header__title">{patient.firstName} {patient.lastName}</h1>
          <p className="admin-header__desc">{english ? "Created" : "Creado"} {patient.createdAt ? new Date(String(patient.createdAt)).toLocaleString(english ? "en-US" : "es-MX") : ""}</p>
        </div>
        <button className="admin-btn admin-btn--ghost admin-chart-archive" type="button" data-tour="chart-archive" onClick={async () => {
          if (!window.confirm(english ? `Archive ${patient.firstName} ${patient.lastName}? The chart stays, but they leave the list.` : `¿Archivar a ${patient.firstName} ${patient.lastName}? El expediente se conserva, pero dejará de aparecer en la lista.`)) return;
          try {
            await api(`/api/admin/patients/${id}`, { method: "DELETE" });
            router.push("/admin/pacientes?archivado=1");
          } catch (err) {
            setError(err instanceof Error ? err.message : (english ? "Could not archive the patient." : "No se pudo archivar el paciente."));
          }
        }}>{english ? "Archive" : "Archivar"}</button>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-banner" role="status">{notice}</p> : null}
      <nav className="admin-nav admin-nav--row chart-tabs" data-tour="chart-tabs" aria-label={english ? "Patient chart" : "Ficha del paciente"}>
        {TABS.map(([item]) => item === "expediente" ? (
          <details key={item} className={`chart-drop${active === "expediente" ? " is-current" : ""}`}>
            <summary className={`admin-nav__item${active === "expediente" ? " admin-nav__item--active" : ""}`}>
              <span>{tabNames.expediente}{active === "expediente" ? ` · ${folderLabel}` : ""}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="chart-drop__menu" role="menu">
              {FOLDERS.map(([key, , slug]) => (
                <Link key={key} role="menuitem" href={`/admin/pacientes/${id}/${slug}`} aria-current={active === "expediente" && folder === key ? "page" : undefined} onClick={(event) => { const menu = event.currentTarget.closest("details"); if (menu) menu.open = false; }}>{folderNames[key]}</Link>
              ))}
            </div>
          </details>
        ) : (
          <Link key={item} className={`admin-nav__item${active === item ? " admin-nav__item--active" : ""}`} href={item === "resumen" ? `/admin/pacientes/${id}` : `/admin/pacientes/${id}/${item}`} aria-current={active === item ? "page" : undefined}>{tabNames[item]}</Link>
        ))}
      </nav>
      <div data-tour="chart-panel">
      {active === "resumen" ? <PatientSummary patient={patient} /> : null}
      {active === "expediente" ? (
        <div className="chart-sheet">
          {folder === "notas" ? (
            <div className="chart-plan">
              <form className="chart-note" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api(`/api/admin/patients/${id}/notes`, { method: "POST", body: JSON.stringify({ body: note, noteType: "free", lock: true }) });
                  setNote("");
                  setNotice("Plan guardado.");
                  const next = await api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/notes`);
                  setRows(next.rows);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo guardar el plan.");
                }
              }}>
                <label className="admin-field">Notas<textarea required value={note} onChange={(e) => setNote(e.target.value)} /></label>
                <div className="chart-note__actions">
                  <button className="admin-btn admin-btn--primary" type="submit">Guardar</button>
                </div>
              </form>
              {rows.length ? (
                <section className="chart-note__saved">
                  <h2>Guardados</h2>
                  {rows.map((row) => (
                    <article key={String(row.id)} className="chart-note__past">
                      {row.title ? <strong>{String(row.title)}</strong> : null}
                      <p>{String(row.body || row.subjective || "")}</p>
                      <button className="admin-btn" type="button" onClick={async () => {
                        if (!window.confirm("¿Eliminar esta nota?")) return;
                        await api(`/api/admin/patients/${id}/notes`, { method: "DELETE", body: JSON.stringify({ id: row.id }) });
                        setRows(rows.filter((item) => item.id !== row.id));
                      }}>Eliminar</button>
                    </article>
                  ))}
                </section>
              ) : null}
            </div>
          ) : null}
          {folder === "sesiones" ? (
            <>
            <form className="chart-block" onSubmit={async (e) => {
              e.preventDefault();
              try {
                const today = new Date();
                const sessionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                await api(`/api/admin/patients/${id}/sessions`, { method: "POST", body: JSON.stringify({ title: sessionDraft.title, sessionDate }) });
                setSessionDraft({ title: "" });
                setNotice("Sesión guardada.");
                const next = await api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/sessions`);
                setRows(next.rows);
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo guardar la sesión.");
              }
            }}>
              <div className="admin-toolbar">
                <input required value={sessionDraft.title} placeholder="Nombre de la sesión" onChange={(e) => setSessionDraft({ ...sessionDraft, title: e.target.value })} />
                <button className="admin-btn admin-btn--primary" type="submit">Agregar sesión</button>
              </div>
            </form>
            {rows.map((row) => (
              <SessionCard key={String(row.id)} patientId={id} row={row} onChange={(next) => setRows(rows.map((item) => item.id === row.id ? next : item))} onDelete={() => setRows(rows.filter((item) => item.id !== row.id))} onError={setError} />
            ))}
            {!rows.length ? <p className="admin-table__empty">Sin sesiones.</p> : null}
            </>
          ) : null}
          {folder === "alergias" ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api(`/api/admin/patients/${id}/${kind}`, { method: "POST", body: JSON.stringify({ value }) });
                setValue("");
                setNotice("Registro guardado.");
                const pairs = await Promise.all(["allergies", "conditions", "medications"].map((name) => api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/${name}`).then((r) => [name, r.rows] as const)));
                setClinical(Object.fromEntries(pairs));
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo guardar.");
              }
            }}>
              <div className="admin-toolbar">
                <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="allergies">Alergia</option><option value="conditions">Condición</option><option value="medications">Medicamento</option></select>
                <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Descripción" required />
                <button className="admin-btn admin-btn--primary" type="submit">Agregar</button>
              </div>
              {(["allergies", "conditions", "medications"] as const).map((name) => (
                <section key={name} className="chart-block">
                  <h2>{name === "allergies" ? "Alergias" : name === "conditions" ? "Condiciones" : "Medicamentos"}</h2>
                  {(clinical[name] || []).map((row) => (
                    <div key={String(row.id)} className="admin-table__row">
                      <span>{String(row.value)}{row.severity ? ` · ${String(row.severity)}` : ""}</span>
                      <button className="admin-btn" type="button" onClick={async () => {
                        if (!window.confirm("¿Eliminar este registro?")) return;
                        try {
                          await api(`/api/admin/patients/${id}/${name}`, { method: "DELETE", body: JSON.stringify({ id: row.id }) });
                          setClinical((current) => ({ ...current, [name]: (current[name] || []).filter((item) => item.id !== row.id) }));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "No se pudo eliminar.");
                        }
                      }}>Eliminar</button>
                    </div>
                  ))}
                  {!(clinical[name] || []).length ? <p className="admin-table__empty">Sin registros.</p> : null}
                </section>
              ))}
            </form>
          ) : null}
          {folder === "estudios" ? (
            <form className="chart-block" onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              data.set("kind", study);
              try {
                await api(`/api/admin/patients/${id}/documents`, { method: "POST", body: data });
                setNotice("Archivo guardado.");
                const next = await api<{ rows: Record<string, unknown>[] }>(`/api/admin/patients/${id}/documents`);
                setRows(next.rows);
                form.reset();
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo guardar el archivo.");
              }
            }}>
              <div className="admin-toolbar">
                {STUDIES.map(([key, label]) => (
                  <button key={key} className={`admin-btn${study === key ? " admin-btn--primary" : ""}`} type="button" onClick={() => setStudy(key)}>{label}</button>
                ))}
              </div>
              <div className="admin-toolbar">
                <input name="title" placeholder="Título del estudio" />
                <input name="file" type="file" accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png" required />
                <button className="admin-btn admin-btn--primary" type="submit">Subir archivo</button>
              </div>
              {rows.filter((row) => row.kind === study).map((row) => (
                <div key={String(row.id)} className="admin-table__row">
                  {row.missing ? <span>{String(row.title)} · archivo no disponible, vuelve a subirlo</span> : <a href={`/api/admin/documents/${row.id}`}>{String(row.title)}</a>}
                  <button className="admin-btn" type="button" onClick={async () => {
                    if (!window.confirm("¿Eliminar este estudio?")) return;
                    await api(`/api/admin/patients/${id}/documents`, { method: "DELETE", body: JSON.stringify({ id: row.id }) });
                    setRows(rows.filter((item) => item.id !== row.id));
                  }}>Eliminar</button>
                </div>
              ))}
              {!rows.some((row) => row.kind === study) ? <p className="admin-table__empty">Sin archivos en esta carpeta.</p> : null}
            </form>
          ) : null}
          {(folder === "fotos" || folder === "documentos") ? (
            <form className="chart-block" onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              if (folder === "fotos") data.set("isPhoto", "1");
              try {
                await api(`/api/admin/patients/${id}/documents`, { method: "POST", body: data });
                setNotice("Archivo guardado.");
                location.reload();
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo guardar el archivo.");
              }
            }}>
              <div className="admin-toolbar"><input name="title" placeholder="Título" /><input name="file" type="file" required /><button className="admin-btn admin-btn--primary" type="submit">Subir</button></div>
              {rows.filter((row) => folder === "fotos" ? row.is_photo : !row.is_photo && !STUDIES.some(([key]) => key === row.kind)).map((row) => (
                <div key={String(row.id)} className="admin-table__row">
                  {row.missing ? <span>{String(row.title)} · archivo no disponible, vuelve a subirlo</span> : <a href={`/api/admin/documents/${row.id}`}>{String(row.title)}</a>}
                  <button className="admin-btn" type="button" onClick={async () => {
                    if (!window.confirm("¿Eliminar este archivo del expediente?")) return;
                    try {
                      await api(`/api/admin/patients/${id}/documents`, { method: "DELETE", body: JSON.stringify({ id: row.id }) });
                      setRows(rows.filter((item) => item.id !== row.id));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "No se pudo eliminar el archivo.");
                    }
                  }}>Eliminar</button>
                </div>
              ))}
            </form>
          ) : null}
        </div>
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
        <>
          <div className="admin-table-wrap">
            {rows.map((row) => (
              <div key={String(row.id)} className="admin-table__row admin-table__row--sale" onClick={() => {
                api<{ sale: ClinicSale }>(`/api/admin/sales/${row.id}`).then((result) => {
                  setReceipt(saleToReceipt(result.sale, `${patient.firstName} ${patient.lastName}`));
                  setError(null);
                }).catch((err) => setError(err instanceof Error ? err.message : "No se pudo abrir el recibo."));
              }}>
                <div>
                  <div className="admin-table__cell-title">{String(row.sale_number || "Venta")}</div>
                  <div className="admin-table__cell-sub">{row.status === "void" ? "Anulada" : String(row.status || "")} · ${Number(row.total || 0).toFixed(2)}</div>
                </div>
                {row.status !== "void" ? <button className="admin-btn admin-btn--danger" type="button" onClick={async (event) => {
                  event.stopPropagation();
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
          {receipt ? (
            <section className="admin-card admin-receipt">
              <div className="admin-toolbar">
                <button className="admin-btn" type="button" onClick={() => setReceipt(null)}>Cerrar</button>
              </div>
              <StoreReceipt data={receipt} animate={false} labels={SALE_RECEIPT_LABELS} homeHref={`/admin/pacientes/${id}/finanzas`} />
            </section>
          ) : null}
        </>
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

function formatClock(total: number) {
  const safe = Math.max(0, Math.floor(total));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function SessionCard({ patientId, row, onChange, onDelete, onError }: { patientId: string; row: Record<string, unknown>; onChange: (row: Record<string, unknown>) => void; onDelete: () => void; onError: (message: string) => void }) {
  const [title, setTitle] = useState(String(row.title || ""));
  const [notes, setNotes] = useState(String(row.notes || ""));
  const [seconds, setSeconds] = useState(Number(row.durationSeconds || 0));
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const titleRef = useRef(title);
  const notesRef = useRef(notes);
  const secondsRef = useRef(seconds);
  const runningRef = useRef(false);
  const savedNotes = useRef(String(row.notes || ""));
  const savedTitle = useRef(String(row.title || ""));
  const persistRef = useRef<(startTimer: boolean) => Promise<void>>(async () => undefined);
  const sessionDate = String(row.sessionDate || "").slice(0, 10);
  titleRef.current = title;
  notesRef.current = notes;
  secondsRef.current = seconds;
  runningRef.current = running;

  async function persist(startTimer: boolean) {
    const saved = await api<{ durationSeconds?: number; timerStarted?: boolean; sessionDate?: string }>(`/api/admin/patients/${patientId}/sessions`, {
      method: "POST",
      body: JSON.stringify({
        id: row.id,
        title: titleRef.current,
        notes: notesRef.current,
        durationSeconds: secondsRef.current,
        startTimer,
      }),
    });
    savedNotes.current = notesRef.current;
    savedTitle.current = titleRef.current;
    onChange({
      ...row,
      title: titleRef.current,
      notes: notesRef.current,
      durationSeconds: secondsRef.current,
      timerStarted: Boolean(saved.timerStarted || row.timerStarted || startTimer),
      sessionDate: saved.sessionDate || row.sessionDate,
    });
    setStatus(runningRef.current ? "Notas guardadas" : "Tiempo guardado");
  }

  persistRef.current = persist;

  useEffect(() => {
    let last = Date.now();
    const clock = window.setInterval(() => {
      const now = Date.now();
      if (runningRef.current && document.visibilityState === "visible") {
        const delta = Math.floor((now - last) / 1000);
        if (delta > 0) {
          secondsRef.current += delta;
          setSeconds(secondsRef.current);
        }
      }
      last = now;
    }, 1000);
    const autosave = window.setInterval(() => {
      const dirty = notesRef.current !== savedNotes.current || titleRef.current !== savedTitle.current;
      if (!dirty && !runningRef.current) return;
      void persistRef.current(false).catch(() => undefined);
    }, 20000);
    function flush() {
      if (runningRef.current || notesRef.current !== savedNotes.current || titleRef.current !== savedTitle.current) {
        void persistRef.current(false).catch(() => undefined);
      }
    }
    function onHide() {
      if (document.visibilityState === "hidden") flush();
      else last = Date.now();
    }
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(autosave);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const started = Boolean(row.timerStarted) || running;
  return (
    <form className="chart-block" onSubmit={async (e) => {
      e.preventDefault();
      if (!runningRef.current) {
        runningRef.current = true;
        setRunning(true);
        setStatus("");
        return;
      }
      runningRef.current = false;
      setRunning(false);
      try {
        await persist(true);
      } catch (err) {
        runningRef.current = true;
        setRunning(true);
        onError(err instanceof Error ? err.message : "No se pudo guardar la sesión.");
      }
    }}>
      <div className="admin-toolbar">
        <input required value={title} aria-label="Nombre de la sesión" onChange={(e) => setTitle(e.target.value)} />
        <span className="admin-metric__label">{sessionDate ? new Date(`${sessionDate}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "Hoy"}</span>
        <span className={`session-clock${running ? " session-clock--live" : ""}`} aria-live="polite">{formatClock(seconds)}</span>
        <button className="admin-btn admin-btn--primary" type="submit">{running ? "Guardar" : "Empezar"}</button>
        <button className="admin-btn" type="button" onClick={async () => {
          if (!window.confirm("¿Eliminar esta sesión?")) return;
          await api(`/api/admin/patients/${patientId}/sessions`, { method: "DELETE", body: JSON.stringify({ id: row.id }) });
          onDelete();
        }}>Eliminar</button>
      </div>
      <p className="admin-metric__label">
        {running ? "En curso. Guardar termina la sesión y deja el tiempo guardado." : started ? "Tiempo guardado. Empezar vuelve a cronometrar." : "Empezar cronometra la sesión. Guardar la termina."}
        {status ? ` · ${status}` : ""}
      </p>
      <label className="admin-field">Notas de la sesión<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
    </form>
  );
}

function PatientSummary({ patient }: { patient: Patient }) {
  const address = [patient.street, patient.streetNumber, patient.neighborhood, patient.city, patient.state, patient.postalCode, patient.country].filter(Boolean).join(", ");
  const facts: [string, unknown][] = [
    ["Código", patient.clientCode],
    ["Email", patient.email],
    ["Móvil", patient.mobile],
    ["Teléfono", patient.phone],
    ["Nacimiento", patient.birthDate],
    ["Sexo", [sexLabel(patient.sex), patient.sex === "otro" ? patient.sexDetail : ""].filter(Boolean).join(" · ")],
    ["Contacto de emergencia", [patient.emergencyName, patient.emergencyPhone, patient.emergencyRelation].filter(Boolean).join(" · ")],
    ["Cómo nos descubrieron", patient.marketingSource || "Sin fuente"],
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
