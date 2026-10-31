"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

type NoteEditorProps = {
  patientId: string;
  noteId?: string;
  initialTitle?: string;
  initialBody?: string;
  onSave: (data: { title: string; body: string }) => Promise<void>;
  onCancel: () => void;
  english?: boolean;
};

export function NoteEditor({
  patientId,
  noteId,
  initialTitle = "",
  initialBody = "",
  onSave,
  onCancel,
  english = false,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialBody,
    editorProps: {
      attributes: {
        class: "note-editor__content",
      },
    },
  });

  useEffect(() => {
    const autosave = setInterval(() => {
      if (editor && !saving) {
        const body = editor.getHTML();
        if (body !== initialBody || title !== initialTitle) {
          void handleSave();
        }
      }
    }, 30000);

    return () => clearInterval(autosave);
  }, [editor, title, saving]);

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ title, body: editor.getHTML() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="note-editor">
      <div className="note-editor__toolbar">
        <button
          type="button"
          className="note-editor__tool"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          data-active={editor?.isActive("bold")}
          title={english ? "Bold" : "Negrita"}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="note-editor__tool"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          data-active={editor?.isActive("italic")}
          title={english ? "Italic" : "Cursiva"}
        >
          <em>I</em>
        </button>
        <div className="note-editor__divider" />
        <button
          type="button"
          className="note-editor__tool"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor?.isActive("heading", { level: 2 })}
          title={english ? "Heading 2" : "Título 2"}
        >
          H2
        </button>
        <button
          type="button"
          className="note-editor__tool"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          data-active={editor?.isActive("heading", { level: 3 })}
          title={english ? "Heading 3" : "Título 3"}
        >
          H3
        </button>
        <div className="note-editor__divider" />
        <button
          type="button"
          className="note-editor__tool"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          data-active={editor?.isActive("bulletList")}
          title={english ? "Bullet list" : "Lista con viñetas"}
        >
          •
        </button>
        <button
          type="button"
          className="note-editor__tool"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          data-active={editor?.isActive("orderedList")}
          title={english ? "Numbered list" : "Lista numerada"}
        >
          1.
        </button>
      </div>

      <div className="note-editor__paper">
        <input
          type="text"
          className="note-editor__title"
          placeholder={english ? "Untitled note" : "Nota sin título"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <EditorContent editor={editor} />
      </div>

      <div className="note-editor__actions">
        {error && <span className="note-editor__error">{error}</span>}
        <button type="button" className="admin-btn" onClick={onCancel}>
          {english ? "Cancel" : "Cancelar"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? english
              ? "Saving..."
              : "Guardando..."
            : english
              ? "Save"
              : "Guardar"}
        </button>
      </div>
    </div>
  );
}
