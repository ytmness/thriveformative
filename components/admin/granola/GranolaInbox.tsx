"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { useAdminEnglish } from "@/components/admin/clinic/ClinicScope";

type InboxRow = {
  id: string;
  granolaNoteId: string;
  title: string | null;
  noteDate: string | null;
  createdAt: string;
  unassignedReason?: string | null;
  matchedSession?: number | null;
  hasSummary?: boolean;
  hasNotes?: boolean;
  hasTranscript?: boolean;
};

type PatientOpt = { id: string; firstName?: string; lastName?: string };

export function GranolaInbox() {
  const english = useAdminEnglish();
  const [configured, setConfigured] = useState(true);
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [patientId, setPatientId] = useState("");
  const [folderKey, setFolderKey] = useState("plan90");
  const [sessionNumber, setSessionNumber] = useState("1");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const result = await api<{ configured: boolean; rows: InboxRow[] }>("/api/admin/granola?view=inbox");
    setConfigured(result.configured);
    setRows(result.rows || []);
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la bandeja."));
    api<{ rows: PatientOpt[] }>("/api/admin/patients?limit=80")
      .then((result) => setPatients(result.rows || []))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <header className="admin-header">
        <div>
          <p className="admin-header__eyebrow">Granola</p>
          <h1 className="admin-header__title">{english ? "Unassigned Granola notes" : "Notas Granola sin asignar"}</h1>
          <p className="admin-header__desc">
            {english
              ? "Title in Granola: TF-00013 = 90-day plan · TF-00013-S1 = Session 1"
              : "Título en Granola: TF-00013 = Plan 90 días · TF-00013-S1 = Sesión 1"}
          </p>
        </div>
      </header>
      {!configured ? <p className="admin-banner">{english ? "Connect Granola in Settings." : "Conecta Granola en Configuración."}</p> : null}
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">{english ? "Patient" : "Paciente"}</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>
          ))}
        </select>
        <select value={folderKey} onChange={(e) => setFolderKey(e.target.value)}>
          <option value="plan90">{english ? "90-day plan" : "Plan de 90 días"}</option>
          <option value="prioridades">{english ? "Functional priorities" : "Prioridades funcionales"}</option>
          <option value="desequilibrios">{english ? "Initial imbalances" : "Desequilibrios iniciales"}</option>
          <option value="sesiones">{english ? "Sessions" : "Sesiones"}</option>
        </select>
        {folderKey === "sesiones" ? (
          <label>
            {english ? "Session #" : "Sesión N"}{" "}
            <input
              type="number"
              min={1}
              max={99}
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
              style={{ width: "4.5rem" }}
            />
          </label>
        ) : null}
        <label className="admin-check"><input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} /> {english ? "Summary" : "Resumen"}</label>
        <label className="admin-check"><input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} /> {english ? "Private notes" : "Notas propias"}</label>
        <label className="admin-check"><input type="checkbox" checked={includeTranscript} onChange={(e) => setIncludeTranscript(e.target.checked)} /> {english ? "Full transcript" : "Transcripción completa"}</label>
      </div>
      <div className="admin-table-wrap">
        {rows.map((row) => (
          <div key={row.id} className="admin-table__row comm-row">
            <div>
              <div className="admin-table__cell-title">{row.title || "Granola"}</div>
              <div className="admin-table__cell-sub">
                {row.noteDate ? new Date(row.noteDate).toLocaleString(english ? "en-US" : "es-MX") : new Date(row.createdAt).toLocaleString(english ? "en-US" : "es-MX")}
              </div>
              {row.unassignedReason ? (
                <div className="admin-alert" role="status" style={{ marginTop: "0.5rem" }}>{row.unassignedReason}</div>
              ) : null}
            </div>
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={async () => {
                if (!patientId) {
                  setError(english ? "Choose a patient first." : "Elige un paciente primero.");
                  return;
                }
                if (folderKey === "sesiones" && !Number(sessionNumber)) {
                  setError(english ? "Enter a session number." : "Indica el número de sesión.");
                  return;
                }
                try {
                  await api("/api/admin/granola", {
                    method: "POST",
                    body: JSON.stringify({
                      action: "assign",
                      inboxId: row.id,
                      patientId,
                      folderKey,
                      sessionNumber: folderKey === "sesiones" ? Number(sessionNumber || row.matchedSession || 1) : null,
                      include: { summary: includeSummary, notes: includeNotes, transcript: includeTranscript },
                    }),
                  });
                  setRows(rows.filter((item) => item.id !== row.id));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo asignar.");
                }
              }}
            >
              {english ? "Assign" : "Asignar"}
            </button>
          </div>
        ))}
        {!rows.length ? <div className="admin-table__empty">{english ? "No unassigned notes." : "Sin notas pendientes."}</div> : null}
      </div>
    </div>
  );
}
