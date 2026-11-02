"use client";

import { useState } from "react";

type Note = {
  id: string;
  title?: string | null;
  body?: string | null;
  subjective?: string | null;
  created_at?: string;
  createdAt?: string;
  locked_at?: string | null;
  lockedAt?: string | null;
};

type NotesListProps = {
  notes: Note[];
  patientId: string;
  onNoteClick: (noteId: string) => void;
  onNewNote: () => void;
  onDeleteNote: (noteId: string) => Promise<void>;
  english?: boolean;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function getPreview(note: Note): string {
  const content = note.body || note.subjective || "";
  const text = stripHtml(content);
  return text.length > 150 ? text.slice(0, 150) + "..." : text;
}

export function NotesList({
  notes,
  patientId,
  onNoteClick,
  onNewNote,
  onDeleteNote,
  english = false,
}: NotesListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(noteId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(english ? "Delete this note?" : "¿Eliminar esta nota?")) return;
    setDeleting(noteId);
    try {
      await onDeleteNote(noteId);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="notes-list">
      <div className="notes-list__header">
        <h2 className="notes-list__title">
          {english ? "90-day plan notes" : "Plan de 90 días"}
        </h2>
        <button className="admin-btn admin-btn--primary" type="button" onClick={onNewNote}>
          {english ? "+ New note" : "+ Nueva nota"}
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="notes-list__empty">
          {english
            ? "No notes yet. Create the first one to start documenting the plan."
            : "Aún no hay notas. Crea la primera para empezar a documentar el plan."}
        </div>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className="note-card"
            onClick={() => onNoteClick(note.id)}
          >
            <h3 className="note-card__title">
              {note.title || (english ? "Untitled note" : "Nota sin título")}
            </h3>
            {getPreview(note) && (
              <p className="note-card__preview">{getPreview(note)}</p>
            )}
            <div className="note-card__meta">
              {(note.createdAt || note.created_at) && (
                <span>
                  {new Date(String(note.createdAt || note.created_at)).toLocaleDateString(
                    english ? "en-US" : "es-MX",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </span>
              )}
              {(note.lockedAt || note.locked_at) && (
                <span>• {english ? "Signed" : "Firmada"}</span>
              )}
            </div>
            {!(note.lockedAt || note.locked_at) && (
              <div className="note-card__actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  onClick={(e) => handleDelete(note.id, e)}
                  disabled={deleting === note.id}
                >
                  {deleting === note.id
                    ? english
                      ? "Deleting..."
                      : "Eliminando..."
                    : english
                      ? "Delete"
                      : "Eliminar"}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
