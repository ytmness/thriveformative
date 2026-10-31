"use client";

import { Extension } from "@tiptap/core";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/app/styles/note-editor.css";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Plus,
  Printer,
  Redo2,
  RemoveFormatting,
  Search,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

type NoteEditorProps = {
  patientId?: string;
  noteId?: string;
  initialTitle?: string;
  initialBody?: string;
  onSave?: (data: { title: string; body: string }) => Promise<void>;
  onCancel?: () => void;
  onBodyChange?: (html: string) => void;
  english?: boolean;
  variant?: "note" | "session";
};

type MenuId = "menus" | "align" | "space" | "color" | "mark" | null;

const FONTS = ["Arial", "Calibri", "Georgia", "Times New Roman", "Verdana", "Courier New", "Trebuchet MS"];
const SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 36, 48];
const ZOOMS = [75, 90, 100, 125, 150];
const LINE_HEIGHTS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
];
const TEXT_COLORS = ["#000000", "#434343", "#666666", "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff"];
const HIGHLIGHTS = ["#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff9900", "#fce5cd", "#d9ead3", "#cfe2f3", "#ead1dc"];

const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => Number(element.getAttribute("data-indent")) || 0,
            renderHTML: (attributes) => (attributes.indent ? { "data-indent": String(attributes.indent) } : {}),
          },
        },
      },
    ];
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => indentBlock(this.editor, 1),
      "Shift-Tab": () => indentBlock(this.editor, -1),
    };
  },
});

function indentBlock(editor: Editor, dir: 1 | -1) {
  if (dir > 0) {
    if (editor.can().sinkListItem("listItem")) return editor.chain().focus().sinkListItem("listItem").run();
    if (editor.can().sinkListItem("taskItem")) return editor.chain().focus().sinkListItem("taskItem").run();
  } else {
    if (editor.can().liftListItem("listItem")) return editor.chain().focus().liftListItem("listItem").run();
    if (editor.can().liftListItem("taskItem")) return editor.chain().focus().liftListItem("taskItem").run();
  }
  const type = editor.isActive("heading") ? "heading" : "paragraph";
  const current = Number(editor.getAttributes(type).indent || 0);
  const next = Math.max(0, Math.min(8, current + dir));
  return editor.chain().focus().updateAttributes(type, { indent: next }).run();
}

function toEditorContent(raw: string) {
  const text = raw.trim();
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return `<p>${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "</p><p>")}</p>`;
}

function currentSize(editor: Editor | null) {
  const raw = String(editor?.getAttributes("textStyle").fontSize || "11pt");
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 11;
}

function AlignIcon({ align }: { align: string }) {
  if (align === "center") return <AlignCenter size={16} strokeWidth={1.75} />;
  if (align === "right") return <AlignRight size={16} strokeWidth={1.75} />;
  if (align === "justify") return <AlignJustify size={16} strokeWidth={1.75} />;
  return <AlignLeft size={16} strokeWidth={1.75} />;
}

function SpacingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
      <path d="M20 4v4M20 16v4" />
    </svg>
  );
}

function ToolBtn({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="note-editor__tool"
      title={title}
      aria-label={title}
      aria-pressed={active}
      data-active={active ? "true" : "false"}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Flyout({
  onClose,
  className,
  children,
}: {
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function NoteEditor({
  initialTitle = "",
  initialBody = "",
  onSave,
  onCancel,
  onBodyChange,
  english = false,
  variant = "note",
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [open, setOpen] = useState<MenuId>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const session = variant === "session";
  const copy = useMemo(
    () =>
      english
        ? {
            untitled: "Untitled document",
            placeholder: "Start typing",
            save: "Save",
            saving: "Saving...",
            cancel: "Cancel",
            menus: "Menus",
            menusSearch: "Search the menus",
            undo: "Undo",
            redo: "Redo",
            print: "Print",
            zoom: "Zoom",
            style: "Styles",
            normal: "Normal text",
            title: "Title",
            h1: "Heading 1",
            h2: "Heading 2",
            font: "Font",
            size: "Font size",
            smaller: "Decrease font size",
            larger: "Increase font size",
            bold: "Bold",
            italic: "Italic",
            underline: "Underline",
            strike: "Strikethrough",
            color: "Text color",
            highlight: "Highlight color",
            link: "Insert link",
            hr: "Horizontal line",
            selectAll: "Select all",
            align: "Align",
            left: "Left",
            center: "Center",
            right: "Right",
            justify: "Justify",
            spacing: "Line & paragraph spacing",
            checklist: "Checklist",
            bullets: "Bulleted list",
            numbered: "Numbered list",
            outdent: "Decrease indent",
            indent: "Increase indent",
            clear: "Clear formatting",
            linkPrompt: "Link URL",
          }
        : {
            untitled: "Documento sin título",
            placeholder: "Empieza a escribir",
            save: "Guardar",
            saving: "Guardando...",
            cancel: "Cancelar",
            menus: "Menús",
            menusSearch: "Buscar en los menús",
            undo: "Deshacer",
            redo: "Rehacer",
            print: "Imprimir",
            zoom: "Zoom",
            style: "Estilos",
            normal: "Texto normal",
            title: "Título",
            h1: "Encabezado 1",
            h2: "Encabezado 2",
            font: "Fuente",
            size: "Tamaño",
            smaller: "Reducir tamaño",
            larger: "Aumentar tamaño",
            bold: "Negrita",
            italic: "Cursiva",
            underline: "Subrayado",
            strike: "Tachado",
            color: "Color de texto",
            highlight: "Resaltado",
            link: "Insertar vínculo",
            hr: "Línea horizontal",
            selectAll: "Seleccionar todo",
            align: "Alinear",
            left: "Izquierda",
            center: "Centro",
            right: "Derecha",
            justify: "Justificar",
            spacing: "Interlineado y espaciado",
            checklist: "Lista de tareas",
            bullets: "Viñetas",
            numbered: "Lista numerada",
            outdent: "Reducir sangría",
            indent: "Aumentar sangría",
            clear: "Borrar formato",
            linkPrompt: "URL del vínculo",
          },
    [english]
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyleKit.configure({
        lineHeight: { types: ["paragraph", "heading", "textStyle"] },
      }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: copy.placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Indent,
    ],
    content: toEditorContent(initialBody),
    editorProps: {
      attributes: { class: "note-editor__content" },
    },
    onUpdate: ({ editor: next }) => {
      onBodyChange?.(next.getHTML());
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ title, body: editor.getHTML() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [editor, title, onSave]);

  useEffect(() => {
    if (session || !onSave) return;
    const autosave = setInterval(() => {
      if (editor && !saving) {
        const body = editor.getHTML();
        if (body !== toEditorContent(initialBody) || title !== initialTitle) {
          void handleSave();
        }
      }
    }, 30000);
    return () => clearInterval(autosave);
  }, [editor, title, saving, initialBody, initialTitle, handleSave, session, onSave]);

  const size = currentSize(editor);
  const font = String(editor?.getAttributes("textStyle").fontFamily || "Arial");
  const styleValue = editor?.isActive("heading", { level: 1 })
    ? "title"
    : editor?.isActive("heading", { level: 2 })
      ? "h1"
      : editor?.isActive("heading", { level: 3 })
        ? "h2"
        : "normal";
  const align = editor?.isActive({ textAlign: "center" })
    ? "center"
    : editor?.isActive({ textAlign: "right" })
      ? "right"
      : editor?.isActive({ textAlign: "justify" })
        ? "justify"
        : "left";
  const textColor = String(editor?.getAttributes("textStyle").color || "#000000");

  function setStyle(value: string) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (value === "title") chain.setHeading({ level: 1 }).run();
    else if (value === "h1") chain.setHeading({ level: 2 }).run();
    else if (value === "h2") chain.setHeading({ level: 3 }).run();
    else chain.setParagraph().run();
  }

  function bumpSize(delta: number) {
    if (!editor) return;
    const next = SIZES.includes(size + delta)
      ? size + delta
      : SIZES.reduce((best, n) => (delta > 0 ? (n > size && n < best ? n : best) : n < size && n > best ? n : best), delta > 0 ? 48 : 8);
    editor.chain().focus().setFontSize(`${next}pt`).run();
  }

  function insertLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(copy.linkPrompt, previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function clearFormat() {
    editor
      ?.chain()
      .focus()
      .unsetAllMarks()
      .clearNodes()
      .setParagraph()
      .unsetColor()
      .unsetHighlight()
      .unsetFontFamily()
      .unsetFontSize()
      .unsetLineHeight()
      .updateAttributes("paragraph", { indent: 0 })
      .run();
  }

  const commands = useMemo(() => {
    if (!editor) return [];
    return [
      { id: "undo", label: copy.undo, run: () => editor.chain().focus().undo().run() },
      { id: "redo", label: copy.redo, run: () => editor.chain().focus().redo().run() },
      { id: "print", label: copy.print, run: () => window.print() },
      { id: "bold", label: copy.bold, run: () => editor.chain().focus().toggleBold().run() },
      { id: "italic", label: copy.italic, run: () => editor.chain().focus().toggleItalic().run() },
      { id: "underline", label: copy.underline, run: () => editor.chain().focus().toggleUnderline().run() },
      { id: "strike", label: copy.strike, run: () => editor.chain().focus().toggleStrike().run() },
      { id: "link", label: copy.link, run: insertLink },
      { id: "hr", label: copy.hr, run: () => editor.chain().focus().setHorizontalRule().run() },
      { id: "left", label: `${copy.align} · ${copy.left}`, run: () => editor.chain().focus().setTextAlign("left").run() },
      { id: "center", label: `${copy.align} · ${copy.center}`, run: () => editor.chain().focus().setTextAlign("center").run() },
      { id: "right", label: `${copy.align} · ${copy.right}`, run: () => editor.chain().focus().setTextAlign("right").run() },
      { id: "justify", label: `${copy.align} · ${copy.justify}`, run: () => editor.chain().focus().setTextAlign("justify").run() },
      { id: "checklist", label: copy.checklist, run: () => editor.chain().focus().toggleTaskList().run() },
      { id: "bullets", label: copy.bullets, run: () => editor.chain().focus().toggleBulletList().run() },
      { id: "numbered", label: copy.numbered, run: () => editor.chain().focus().toggleOrderedList().run() },
      { id: "indent", label: copy.indent, run: () => indentBlock(editor, 1) },
      { id: "outdent", label: copy.outdent, run: () => indentBlock(editor, -1) },
      { id: "select", label: copy.selectAll, run: () => editor.chain().focus().selectAll().run() },
      { id: "clear", label: copy.clear, run: clearFormat },
      { id: "title", label: copy.title, run: () => setStyle("title") },
      { id: "h1", label: copy.h1, run: () => setStyle("h1") },
      { id: "h2", label: copy.h2, run: () => setStyle("h2") },
      { id: "normal", label: copy.normal, run: () => setStyle("normal") },
    ];
  }, [editor, copy]);

  const filteredCommands = commands.filter((item) => item.label.toLowerCase().includes(menuQuery.trim().toLowerCase()));
  const sheetHeight = session ? 560 : 1056;
  const close = useCallback(() => {
    setOpen(null);
    setMenuQuery("");
  }, []);

  return (
    <div className={`note-editor${session ? " note-editor--session" : ""}`}>
      <div className="note-editor__chrome">
        <div className="note-editor__toolbar" role="toolbar" aria-label={english ? "Formatting" : "Formato"}>
          <div className="note-editor__split">
            <button
              type="button"
              className="note-editor__menus"
              title={copy.menus}
              aria-haspopup="menu"
              aria-expanded={open === "menus"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen((v) => (v === "menus" ? null : "menus"))}
            >
              <Search size={15} strokeWidth={1.75} />
              <span>{copy.menus}</span>
            </button>
            {open === "menus" ? (
              <Flyout onClose={close} className="note-editor__menu note-editor__menu--commands">
                <input
                  autoFocus
                  className="note-editor__menu-search"
                  placeholder={copy.menusSearch}
                  value={menuQuery}
                  onChange={(e) => setMenuQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredCommands[0]) {
                        filteredCommands[0].run();
                        close();
                      }
                    }
                    if (e.key === "Escape") close();
                  }}
                />
                <div className="note-editor__menu-list" role="menu">
                  {filteredCommands.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        item.run();
                        close();
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </Flyout>
            ) : null}
          </div>

          <span className="note-editor__divider" />
          <ToolBtn title={copy.undo} disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.redo} disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.print} onClick={() => window.print()}>
            <Printer size={16} strokeWidth={1.75} />
          </ToolBtn>
          <label className="note-editor__select-wrap" title={copy.zoom}>
            <select className="note-editor__select" value={zoom} aria-label={copy.zoom} onChange={(e) => setZoom(Number(e.target.value))}>
              {ZOOMS.map((n) => (
                <option key={n} value={n}>
                  {n}%
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="note-editor__chevron" />
          </label>

          <span className="note-editor__divider" />
          <label className="note-editor__select-wrap note-editor__select-wrap--style" title={copy.style}>
            <select className="note-editor__select" value={styleValue} aria-label={copy.style} onChange={(e) => setStyle(e.target.value)}>
              <option value="normal">{copy.normal}</option>
              <option value="title">{copy.title}</option>
              <option value="h1">{copy.h1}</option>
              <option value="h2">{copy.h2}</option>
            </select>
            <ChevronDown size={12} className="note-editor__chevron" />
          </label>
          <label className="note-editor__select-wrap note-editor__select-wrap--font" title={copy.font}>
            <select
              className="note-editor__select"
              value={FONTS.includes(font) ? font : "Arial"}
              aria-label={copy.font}
              onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
            >
              {FONTS.map((name) => (
                <option key={name} value={name} style={{ fontFamily: name }}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="note-editor__chevron" />
          </label>
          <ToolBtn title={copy.smaller} onClick={() => bumpSize(-1)}>
            <Minus size={14} strokeWidth={2} />
          </ToolBtn>
          <label className="note-editor__select-wrap note-editor__select-wrap--size" title={copy.size}>
            <select
              className="note-editor__select"
              value={SIZES.includes(size) ? size : 11}
              aria-label={copy.size}
              onChange={(e) => editor?.chain().focus().setFontSize(`${e.target.value}pt`).run()}
            >
              {SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <ToolBtn title={copy.larger} onClick={() => bumpSize(1)}>
            <Plus size={14} strokeWidth={2} />
          </ToolBtn>

          <span className="note-editor__divider" />
          <ToolBtn title={copy.bold} active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold size={16} strokeWidth={2.4} />
          </ToolBtn>
          <ToolBtn title={copy.italic} active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic size={16} strokeWidth={2} />
          </ToolBtn>
          <ToolBtn title={copy.underline} active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={16} strokeWidth={2} />
          </ToolBtn>
          <div className="note-editor__split">
            <ToolBtn title={copy.color} active={open === "color"} onClick={() => setOpen((v) => (v === "color" ? null : "color"))}>
              <span className="note-editor__letter" style={{ borderColor: textColor }}>
                A
              </span>
            </ToolBtn>
            {open === "color" ? (
              <Flyout onClose={close} className="note-editor__palette">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="note-editor__swatch"
                    style={{ background: color }}
                    title={color}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().setColor(color).run();
                      close();
                    }}
                  />
                ))}
              </Flyout>
            ) : null}
          </div>
          <div className="note-editor__split">
            <ToolBtn title={copy.highlight} active={editor?.isActive("highlight") || open === "mark"} onClick={() => setOpen((v) => (v === "mark" ? null : "mark"))}>
              <Highlighter size={16} strokeWidth={1.75} />
            </ToolBtn>
            {open === "mark" ? (
              <Flyout onClose={close} className="note-editor__palette">
                {HIGHLIGHTS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="note-editor__swatch"
                    style={{ background: color }}
                    title={color}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (color === "#ffffff") editor?.chain().focus().unsetHighlight().run();
                      else editor?.chain().focus().toggleHighlight({ color }).run();
                      close();
                    }}
                  />
                ))}
              </Flyout>
            ) : null}
          </div>
          <ToolBtn title={copy.link} active={editor?.isActive("link")} onClick={insertLink}>
            <LinkIcon size={16} strokeWidth={1.75} />
          </ToolBtn>

          <span className="note-editor__divider" />
          <div className="note-editor__split">
            <ToolBtn title={copy.align} active={open === "align"} onClick={() => setOpen((v) => (v === "align" ? null : "align"))}>
              <AlignIcon align={align} />
            </ToolBtn>
            {open === "align" ? (
              <Flyout onClose={close} className="note-editor__menu note-editor__menu--icons">
                {(["left", "center", "right", "justify"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="note-editor__tool"
                    data-active={align === value ? "true" : "false"}
                    title={copy[value]}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().setTextAlign(value).run();
                      close();
                    }}
                  >
                    <AlignIcon align={value} />
                  </button>
                ))}
              </Flyout>
            ) : null}
          </div>
          <div className="note-editor__split">
            <ToolBtn title={copy.spacing} active={open === "space"} onClick={() => setOpen((v) => (v === "space" ? null : "space"))}>
              <SpacingIcon />
            </ToolBtn>
            {open === "space" ? (
              <Flyout onClose={close} className="note-editor__menu">
                {LINE_HEIGHTS.map((row) => (
                  <button
                    key={row.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().setLineHeight(row.value).run();
                      close();
                    }}
                  >
                    {row.label}
                  </button>
                ))}
              </Flyout>
            ) : null}
          </div>
          <ToolBtn title={copy.outdent} onClick={() => editor && indentBlock(editor, -1)}>
            <IndentDecrease size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.indent} onClick={() => editor && indentBlock(editor, 1)}>
            <IndentIncrease size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.checklist} active={editor?.isActive("taskList")} onClick={() => editor?.chain().focus().toggleTaskList().run()}>
            <ListChecks size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.bullets} active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.numbered} active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} strokeWidth={1.75} />
          </ToolBtn>
          <ToolBtn title={copy.clear} onClick={clearFormat}>
            <RemoveFormatting size={16} strokeWidth={1.75} />
          </ToolBtn>
        </div>

        <div className="note-editor__ruler" aria-hidden>
          <div className="note-editor__ruler-track">
            {Array.from({ length: 68 }, (_, i) => {
              const eighths = i + 1;
              if (eighths % 8 === 0) return null;
              return (
                <i
                  key={i}
                  className={`note-editor__minor${eighths % 4 === 0 ? " note-editor__minor--half" : ""}`}
                  style={{ left: `${(eighths / 8 / 8.5) * 100}%` }}
                />
              );
            })}
            {Array.from({ length: 9 }, (_, inch) => (
              <span key={inch} className="note-editor__inch" style={{ left: `${(inch / 8.5) * 100}%` }}>
                {inch === 0 ? "" : inch}
              </span>
            ))}
            <span className="note-editor__tab" style={{ left: `${(1 / 8.5) * 100}%` }} />
            <span className="note-editor__tab note-editor__tab--right" style={{ left: `${(7.5 / 8.5) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="note-editor__canvas">
        <div className="note-editor__slot" style={{ height: (sheetHeight * zoom) / 100 }}>
          <div className="note-editor__sheet" style={{ transform: `scale(${zoom / 100})` }}>
            <div className="note-editor__paper" style={{ minHeight: sheetHeight }}>
              {session ? null : (
                <input
                  type="text"
                  className="note-editor__title"
                  placeholder={copy.untitled}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {session || !onSave ? null : (
        <div className="note-editor__actions">
          {error && <span className="note-editor__error">{error}</span>}
          {onCancel ? (
            <button type="button" className="admin-btn" onClick={onCancel}>
              {copy.cancel}
            </button>
          ) : null}
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? copy.saving : copy.save}
          </button>
        </div>
      )}
    </div>
  );
}
