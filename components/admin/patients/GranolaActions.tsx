"use client";

import { useState } from "react";
import { api } from "@/components/admin/clinic/client";

type GranolaNote = { id: string; title: string; createdAt: string | null };

export function GranolaActions({
  patientId,
  folderKey,
  english = false,
  onImported,
}: {
  patientId: string;
  folderKey: string;
  english?: boolean;
  onImported?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<GranolaNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadNotes() {
    setError(null);
    try {
      const result = await api<{ configured: boolean; notes: GranolaNote[] }>("/api/admin/granola?view=notes");
      setConfigured(result.configured);
      setNotes(result.notes || []);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir Granola.");
    }
  }

  return (
    <div className="granola-actions">
      <div className="admin-toolbar">
        <a className="admin-btn" href="https://app.granola.ai" target="_blank" rel="noreferrer">
          {english ? "Open Granola" : "Abrir Granola"}
        </a>
        <button className="admin-btn admin-btn--primary" type="button" onClick={loadNotes}>
          {english ? "Import from Granola" : "Importar de Granola"}
        </button>
      </div>
      {configured === false ? (
        <p className="admin-banner">{english ? "Connect Granola in Settings." : "Conecta Granola en Configuración."}</p>
      ) : null}
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {open ? (
        <div className="granola-modal" role="dialog" aria-label={english ? "Granola notes" : "Notas de Granola"}>
          <div className="granola-modal__card">
            <div className="admin-toolbar">
              <strong>{english ? "Recent Granola notes" : "Notas recientes de Granola"}</strong>
              <button className="admin-btn" type="button" onClick={() => setOpen(false)}>{english ? "Close" : "Cerrar"}</button>
            </div>
            {!notes.length ? <p className="admin-table__empty">{english ? "No notes to import." : "No hay notas para importar."}</p> : null}
            {notes.map((note) => (
              <div key={note.id} className="admin-table__row comm-row">
                <div>
                  <div className="admin-table__cell-title">{note.title}</div>
                  <div className="admin-table__cell-sub">
                    {note.createdAt ? new Date(note.createdAt).toLocaleString(english ? "en-US" : "es-MX") : ""}
                  </div>
                </div>
                <button
                  className="admin-btn admin-btn--primary"
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api("/api/admin/granola", {
                        method: "POST",
                        body: JSON.stringify({ action: "import", granolaNoteId: note.id, patientId, folderKey }),
                      });
                      onImported?.();
                      setOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "No se pudo importar.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {english ? "Insert" : "Insertar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
