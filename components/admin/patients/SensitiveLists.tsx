"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

type Kind = "medications" | "supplements" | "allergies" | "conditions";

type Row = {
  id: string;
  value?: string;
  severity?: string | null;
  dose?: string | null;
  frequency?: string | null;
  sinceDate?: string | null;
  notes?: string | null;
};

const SECTIONS: { kind: Kind; es: string; en: string }[] = [
  { kind: "medications", es: "Medicamentos activos", en: "Active medications" },
  { kind: "supplements", es: "Suplementos", en: "Supplements" },
  { kind: "allergies", es: "Alergias", en: "Allergies" },
];

const EMPTY = { value: "", dose: "", frequency: "", sinceDate: "", notes: "", severity: "" };

export function SensitiveLists({ patientId, english = false }: { patientId: string; english?: boolean }) {
  const [clinical, setClinical] = useState<Record<string, Row[]>>({});
  const [kind, setKind] = useState<Kind>("medications");
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const extraConditions = clinical.conditions || [];

  async function reload() {
    const names: Kind[] = ["medications", "supplements", "allergies", "conditions"];
    const pairs = await Promise.all(
      names.map((name) => api<{ rows: Row[] }>(`/api/admin/patients/${patientId}/${name}`).then((result) => [name, result.rows] as const))
    );
    setClinical(Object.fromEntries(pairs));
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los registros."));
  }, [patientId]);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await api(`/api/admin/patients/${patientId}/${kind}`, {
            method: "POST",
            body: JSON.stringify(form),
          });
          setForm(EMPTY);
          await reload();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo guardar.");
        }
      }}
    >
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      <div className="chart-sensitive__form">
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          {SECTIONS.map((section) => (
            <option key={section.kind} value={section.kind}>{english ? section.en : section.es}</option>
          ))}
        </select>
        <input required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={english ? "Name" : "Nombre"} />
        <input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder={english ? "Dose" : "Dosis"} />
        <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder={english ? "Frequency" : "Frecuencia"} />
        <input type="date" value={form.sinceDate} onChange={(e) => setForm({ ...form, sinceDate: e.target.value })} />
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={english ? "Notes" : "Notas"} />
        {kind === "allergies" ? (
          <input value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} placeholder={english ? "Severity" : "Severidad"} />
        ) : null}
        <button className="admin-btn admin-btn--primary" type="submit">{english ? "Add" : "Agregar"}</button>
      </div>
      {SECTIONS.map((section) => (
        <section key={section.kind} className="chart-block">
          <h2>{english ? section.en : section.es}</h2>
          <SensitiveTable
            rows={clinical[section.kind] || []}
            english={english}
            onDelete={async (rowId) => {
              if (!window.confirm(english ? "Delete this record?" : "¿Eliminar este registro?")) return;
              await api(`/api/admin/patients/${patientId}/${section.kind}`, { method: "DELETE", body: JSON.stringify({ id: rowId }) });
              setClinical((current) => ({ ...current, [section.kind]: (current[section.kind] || []).filter((row) => row.id !== rowId) }));
            }}
          />
        </section>
      ))}
      {extraConditions.length ? (
        <section className="chart-block">
          <h2>{english ? "Conditions on file" : "Condiciones en expediente"}</h2>
          <SensitiveTable
            rows={extraConditions}
            english={english}
            onDelete={async (rowId) => {
              if (!window.confirm(english ? "Delete this record?" : "¿Eliminar este registro?")) return;
              await api(`/api/admin/patients/${patientId}/conditions`, { method: "DELETE", body: JSON.stringify({ id: rowId }) });
              setClinical((current) => ({ ...current, conditions: (current.conditions || []).filter((row) => row.id !== rowId) }));
            }}
          />
        </section>
      ) : null}
    </form>
  );
}

function SensitiveTable({ rows, english, onDelete }: { rows: Row[]; english: boolean; onDelete: (id: string) => Promise<void> }) {
  if (!rows.length) return <p className="admin-table__empty">{english ? "No records." : "Sin registros."}</p>;
  return (
    <div className="admin-table-wrap">
      {rows.map((row) => (
        <div key={row.id} className="admin-table__row comm-row">
          <div>
            <div className="admin-table__cell-title">{String(row.value || "")}</div>
            <div className="admin-table__cell-sub">
              {[row.dose, row.frequency, row.sinceDate, row.severity, row.notes].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button className="admin-btn" type="button" onClick={() => onDelete(row.id)}>{english ? "Delete" : "Eliminar"}</button>
        </div>
      ))}
    </div>
  );
}
