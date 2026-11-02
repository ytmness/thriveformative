"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/components/admin/clinic/client";
import { NoteEditor } from "@/components/admin/patients/NoteEditor";
import { NotesList } from "@/components/admin/patients/NotesList";
import { defaultDocumentTitle } from "@/lib/domain/chartFolderMeta";
import { GranolaActions } from "@/components/admin/patients/GranolaActions";

type NoteRow = {
  id: string;
  title?: string | null;
  body?: string | null;
  subjective?: string | null;
  created_at?: string;
  createdAt?: string;
  locked_at?: string | null;
  lockedAt?: string | null;
};

export function ChartNoteFolder({
  patientId,
  folderKey,
  heading,
  english = false,
  extraActions,
  enableGranola = false,
}: {
  patientId: string;
  folderKey: string;
  heading: string;
  english?: boolean;
  extraActions?: ReactNode;
  enableGranola?: boolean;
}) {
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const defaultTitle = defaultDocumentTitle(folderKey, english);

  useEffect(() => {
    api<{ rows: NoteRow[] }>(`/api/admin/patients/${patientId}/notes?folder=${encodeURIComponent(folderKey)}`)
      .then((result) => setRows(result.rows))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las notas."));
  }, [patientId, folderKey]);

  const current = editingNoteId && editingNoteId !== "new" ? rows.find((row) => row.id === editingNoteId) : null;

  return (
    <>
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {notice ? <p className="admin-banner" role="status">{notice}</p> : null}
      {enableGranola ? (
        <GranolaActions
          patientId={patientId}
          folderKey={folderKey}
          english={english}
          onImported={async () => {
            const next = await api<{ rows: NoteRow[] }>(`/api/admin/patients/${patientId}/notes?folder=${encodeURIComponent(folderKey)}`);
            setRows(next.rows);
            setNotice(english ? "Granola note imported." : "Nota de Granola importada.");
          }}
        />
      ) : extraActions}
      {editingNoteId === "new" || editingNoteId ? (
        <NoteEditor
          key={String(editingNoteId)}
          patientId={patientId}
          noteId={editingNoteId === "new" ? undefined : editingNoteId}
          defaultTitle={defaultTitle}
          initialTitle={current ? String(current.title || "") : defaultTitle}
          initialBody={current ? String(current.body || current.subjective || "") : ""}
          onSave={async (data) => {
            await api(`/api/admin/patients/${patientId}/notes`, {
              method: "POST",
              body: JSON.stringify({
                id: editingNoteId === "new" ? undefined : editingNoteId,
                title: data.title || defaultTitle,
                body: data.body,
                noteType: "free",
                folderKey,
                lock: false,
              }),
            });
            const next = await api<{ rows: NoteRow[] }>(`/api/admin/patients/${patientId}/notes?folder=${encodeURIComponent(folderKey)}`);
            setRows(next.rows);
            setEditingNoteId(null);
            setNotice(english ? "Note saved." : "Nota guardada.");
          }}
          onCancel={() => setEditingNoteId(null)}
          english={english}
        />
      ) : (
        <NotesList
          notes={rows}
          patientId={patientId}
          heading={heading}
          onNoteClick={(noteId) => setEditingNoteId(noteId)}
          onNewNote={() => setEditingNoteId("new")}
          onDeleteNote={async (noteId) => {
            await api(`/api/admin/patients/${patientId}/notes`, {
              method: "DELETE",
              body: JSON.stringify({ id: noteId }),
            });
            setRows(rows.filter((item) => item.id !== noteId));
            setNotice(english ? "Note deleted." : "Nota eliminada.");
          }}
          english={english}
        />
      )}
    </>
  );
}
