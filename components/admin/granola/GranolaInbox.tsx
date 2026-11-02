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
};

type PatientOpt = { id: string; firstName?: string; lastName?: string };

export function GranolaInbox() {
  const english = useAdminEnglish();
  const [configured, setConfigured] = useState(true);
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [patientId, setPatientId] = useState("");
  const [folderKey, setFolderKey] = useState("plan90");
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
        </div>
      </header>
      {!configured ? <p className="admin-banner">{english ? "Connect Granola in Settings." : "Conecta Granola en Configuración."}</p> : null}
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      <div className="admin-toolbar">
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">{english ? "Patient" : "Paciente"}</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>
          ))}
        </select>
        <select value={folderKey} onChange={(e) => setFolderKey(e.target.value)}>
          <option value="plan90">{english ? "90-day plan" : "Plan de 90 días"}</option>
          <option value="sesiones">{english ? "Sessions" : "Sesiones"}</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        {rows.map((row) => (
          <div key={row.id} className="admin-table__row comm-row">
            <div>
              <div className="admin-table__cell-title">{row.title || "Granola"}</div>
              <div className="admin-table__cell-sub">
                {row.noteDate ? new Date(row.noteDate).toLocaleString(english ? "en-US" : "es-MX") : new Date(row.createdAt).toLocaleString(english ? "en-US" : "es-MX")}
              </div>
            </div>
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={async () => {
                if (!patientId) {
                  setError(english ? "Choose a patient first." : "Elige un paciente primero.");
                  return;
                }
                try {
                  await api("/api/admin/granola", {
                    method: "POST",
                    body: JSON.stringify({ action: "assign", inboxId: row.id, patientId, folderKey }),
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
