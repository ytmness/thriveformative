"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { useAdminEnglish } from "@/components/admin/clinic/ClinicScope";

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  help?: string;
  options?: string[];
};

type Template = Record<string, unknown>;

const BLOCKS: { type: string; name: string; hint: string }[] = [
  { type: "heading", name: "Título", hint: "Separa una sección" },
  { type: "text", name: "Texto corto", hint: "Una línea" },
  { type: "textarea", name: "Párrafo", hint: "Varias líneas" },
  { type: "date", name: "Fecha", hint: "Día concreto" },
  { type: "checkbox", name: "Casilla", hint: "Sí o no" },
  { type: "select", name: "Lista", hint: "Elige una opción" },
  { type: "signature", name: "Firma", hint: "El paciente firma" },
];

const TYPES: Record<string, string> = {
  intake: "Ingreso",
  consent: "Consentimiento",
  soap: "Nota clínica",
  custom: "Otro",
};

function readSchema(value: unknown): FormField[] {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const field = item as Partial<FormField>;
    return {
      id: String(field.id || crypto.randomUUID()),
      label: String(field.label || "Pregunta"),
      type: String(field.type || "text"),
      required: Boolean(field.required),
      help: field.help ? String(field.help) : "",
      options: Array.isArray(field.options) ? field.options.map(String) : [],
    };
  });
}

export function FormStudio() {
  const english = useAdminEnglish();
  const [rows, setRows] = useState<Template[]>([]);
  const [name, setName] = useState("Formulario nuevo");
  const [formType, setFormType] = useState("consent");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ rows: Template[] }>("/api/admin/forms").then((result) => setRows(result.rows)).catch((err) => setError(err.message));
  }, []);

  const current = fields.find((field) => field.id === selected) || null;

  function addBlock(type: string) {
    const block = BLOCKS.find((item) => item.type === type);
    const field: FormField = {
      id: crypto.randomUUID(),
      label: type === "heading" ? "Nueva sección" : block?.name || "Pregunta",
      type,
      required: type === "signature",
      help: "",
      options: type === "select" ? ["Opción 1", "Opción 2"] : [],
    };
    setFields((list) => [...list, field]);
    setSelected(field.id);
    setNotice(null);
  }

  function patch(id: string, next: Partial<FormField>) {
    setFields((list) => list.map((field) => (field.id === id ? { ...field, ...next } : field)));
  }

  function move(id: string, direction: -1 | 1) {
    setFields((list) => {
      const index = list.findIndex((field) => field.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return list;
      const copy = [...list];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function reset() {
    setTemplateId(null);
    setName("Formulario nuevo");
    setFormType("consent");
    setFields([]);
    setSelected(null);
  }

  function openTemplate(row: Template) {
    setTemplateId(String(row.id));
    setName(String(row.name || "Formulario"));
    setFormType(String(row.form_type || "custom"));
    const schema = readSchema(row.schema);
    setFields(schema);
    setSelected(schema[0]?.id || null);
    setNotice(null);
    setError(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/api/admin/forms", {
        method: "POST",
        body: JSON.stringify({
          id: templateId,
          name: name.trim(),
          formType,
          requiresSignature: formType === "consent" || fields.some((field) => field.type === "signature"),
          schema: fields,
        }),
      });
      setNotice(templateId ? "Formulario actualizado." : "Formulario guardado.");
      reset();
      const next = await api<{ rows: Template[] }>("/api/admin/forms");
      setRows(next.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">{english ? "Clinical" : "Clínico"}</p>
        <h1 className="admin-header__title">{english ? "Forms" : "Formularios"}</h1>
        <p className="admin-header__desc">{english ? "Add blocks and edit them on the page. The patient sees the same layout." : "Agrega bloques y edítalos sobre la hoja, como al armar una página. El paciente verá esto mismo."}</p>
      </header>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
      <div className="form-library" data-tour="form-list">
        <button type="button" className={`form-library__card${!templateId ? " is-active" : ""}`} onClick={reset}>
          <strong>{english ? "New" : "Nuevo"}</strong>
          <span>{english ? "Blank page" : "Hoja en blanco"}</span>
        </button>
        {rows.map((row) => (
          <button key={String(row.id)} type="button" className={`form-library__card${templateId === row.id ? " is-active" : ""}`} onClick={() => openTemplate(row)}>
            <strong>{String(row.name)}</strong>
            <span>{TYPES[String(row.form_type)] || String(row.form_type)} · v{String(row.version)}</span>
          </button>
        ))}
      </div>
      <form className="form-studio" data-tour="form-builder" onSubmit={save}>
        <aside className="form-studio__palette" aria-label="Bloques">
          <p className="form-studio__kicker">Bloques</p>
          {BLOCKS.map((block) => (
            <button key={block.type} className="form-studio__block" type="button" onClick={() => addBlock(block.type)}>
              <strong>{block.name}</strong>
              <span>{block.hint}</span>
            </button>
          ))}
        </aside>
        <section className="form-studio__sheet" aria-label="Hoja del formulario">
          <div className="form-studio__sheet-head">
            <label className="form-studio__title">
              <span className="sr-only">Nombre del formulario</span>
              <input required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <select aria-label="Tipo de formulario" value={formType} onChange={(event) => setFormType(event.target.value)}>
              {Object.entries(TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          {!fields.length ? <p className="form-studio__empty">Elige un bloque a la izquierda. Aparece aquí, en el orden en que lo verá el paciente.</p> : null}
          <ol className="form-studio__fields">
            {fields.map((field, index) => (
              <li key={field.id}>
                <div
                  className={`form-studio__field${selected === field.id ? " is-selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(field.id)}
                  onKeyDown={(event) => { if (event.key === "Enter") setSelected(field.id); }}
                >
                  {field.type === "heading" ? <p className="form-studio__heading">{field.label}</p> : (
                    <>
                      <p className="form-studio__question">{field.label}{field.required ? <span aria-hidden> *</span> : null}</p>
                      {field.help ? <p className="form-studio__help">{field.help}</p> : null}
                      <FieldPreview field={field} />
                    </>
                  )}
                  <div className="form-studio__field-tools">
                    <button type="button" aria-label="Subir" disabled={index === 0} onClick={(event) => { event.stopPropagation(); move(field.id, -1); }}>↑</button>
                    <button type="button" aria-label="Bajar" disabled={index === fields.length - 1} onClick={(event) => { event.stopPropagation(); move(field.id, 1); }}>↓</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="form-studio__save">
            <button className="admin-btn admin-btn--primary" type="submit" data-tour="form-save" disabled={saving}>{saving ? "Guardando…" : templateId ? "Guardar cambios" : "Guardar formulario"}</button>
            {templateId ? (
              <button className="admin-btn" type="button" onClick={async () => {
                if (!window.confirm(`¿Archivar «${name}»? Dejará de aparecer en la lista.`)) return;
                await api("/api/admin/forms", { method: "POST", body: JSON.stringify({ action: "archive", id: templateId }) });
                setRows((list) => list.filter((row) => row.id !== templateId));
                setNotice("Formulario archivado.");
                reset();
              }}>Archivar</button>
            ) : null}
          </div>
        </section>
        <aside className="form-studio__inspector" aria-label="Ajustes del bloque">
          {current ? (
            <>
              <p className="form-studio__kicker">Este bloque</p>
              <label className="admin-field">Texto
                <input value={current.label} onChange={(event) => patch(current.id, { label: event.target.value })} />
              </label>
              {current.type !== "heading" ? (
                <label className="admin-field">Ayuda para el paciente
                  <input value={current.help || ""} placeholder="Opcional" onChange={(event) => patch(current.id, { help: event.target.value })} />
                </label>
              ) : null}
              {current.type === "select" ? (
                <label className="admin-field">Opciones, una por línea
                  <textarea rows={4} value={(current.options || []).join("\n")} onChange={(event) => patch(current.id, { options: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })} />
                </label>
              ) : null}
              {current.type !== "heading" ? (
                <label className="admin-check">
                  <input type="checkbox" checked={current.required} onChange={(event) => patch(current.id, { required: event.target.checked })} />
                  Obligatorio
                </label>
              ) : null}
              <button className="admin-btn" type="button" onClick={() => { setFields((list) => list.filter((field) => field.id !== current.id)); setSelected(null); }}>Quitar bloque</button>
            </>
          ) : (
            <p className="form-studio__empty">Selecciona un bloque de la hoja para cambiar su texto, si es obligatorio o sus opciones.</p>
          )}
        </aside>
      </form>
    </>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  if (field.type === "textarea") return <textarea readOnly rows={3} placeholder="El paciente escribe aquí" />;
  if (field.type === "date") return <input readOnly type="date" />;
  if (field.type === "checkbox") return <label className="admin-check"><input readOnly type="checkbox" /> Sí</label>;
  if (field.type === "select") {
    return (
      <select disabled defaultValue="">
        <option value="">Elige…</option>
        {(field.options || []).map((option) => <option key={option}>{option}</option>)}
      </select>
    );
  }
  if (field.type === "signature") return <div className="form-studio__sign">El paciente firma aquí</div>;
  return <input readOnly type="text" placeholder="El paciente escribe aquí" />;
}
