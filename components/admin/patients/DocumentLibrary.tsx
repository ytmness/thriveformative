"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { DEFAULT_STUDY_FOLDERS, defaultDocumentTitle, folderLabel } from "@/lib/domain/chartFolderMeta";

type Doc = {
  id: string;
  title?: string;
  kind?: string | null;
  folder_id?: string | null;
  folder_slug?: string | null;
  folder_name?: string | null;
  document_date?: string | null;
  created_at?: string;
  missing?: boolean;
};

type Folder = { id: string; name: string; slug: string; parent_key: string };

export function DocumentLibrary({
  patientId,
  parentKey,
  english = false,
}: {
  patientId: string;
  parentKey: "estudios" | "composicion" | "nutricionales";
  english?: boolean;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const heading = folderLabel(parentKey, english);
  const withFolders = parentKey === "estudios";
  const defaultTitle = defaultDocumentTitle(parentKey, english);

  async function reload() {
    const nextDocs = await api<{ rows: Doc[] }>(`/api/admin/patients/${patientId}/documents`);
    setDocs(nextDocs.rows);
    if (withFolders) {
      const nextFolders = await api<{ rows: Folder[] }>(`/api/admin/patients/${patientId}/document-folders?parent=estudios`);
      setFolders(nextFolders.rows);
      setFolderId((current) => current || nextFolders.rows.find((folder) => folder.slug === "imaging")?.id || nextFolders.rows[0]?.id || "");
    }
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los archivos."));
  }, [patientId, parentKey]);

  const visible = useMemo(() => {
    if (parentKey === "composicion") return docs.filter((row) => row.kind === "composicion");
    if (parentKey === "nutricionales") return docs.filter((row) => row.kind === "nutricionales");
    return docs.filter((row) => row.folder_id === folderId || (!row.folder_id && folders.find((folder) => folder.id === folderId)?.slug === "otros" && (!row.kind || row.kind === "document")));
  }, [docs, folderId, folders, parentKey]);

  const selectedFolder = folders.find((folder) => folder.id === folderId);
  const selectedLabel = selectedFolder
    ? (DEFAULT_STUDY_FOLDERS.find((item) => item.slug === selectedFolder.slug)?.[english ? "en" : "es"] || selectedFolder.name)
    : heading;

  return (
    <form
      className="chart-block"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        data.set("kind", parentKey === "estudios" ? (selectedFolder?.slug === "otros" ? "document" : selectedFolder?.slug || "document") : parentKey);
        if (folderId) data.set("folderId", folderId);
        if (!String(data.get("title") || "").trim()) data.set("title", `${selectedLabel} — ${new Date().toLocaleDateString(english ? "en-US" : "es-MX", { day: "numeric", month: "short", year: "numeric" })}`);
        try {
          await api(`/api/admin/patients/${patientId}/documents`, { method: "POST", body: data });
          form.reset();
          await reload();
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo guardar el archivo.");
        }
      }}
    >
      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {withFolders ? (
        <>
          <div className="admin-toolbar chart-folder-pills">
            {folders.map((folder) => {
              const label = DEFAULT_STUDY_FOLDERS.find((item) => item.slug === folder.slug)?.[english ? "en" : "es"] || folder.name;
              return (
                <button
                  key={folder.id}
                  className={`admin-btn${folder.id === folderId ? " admin-btn--primary" : ""}`}
                  type="button"
                  onClick={() => setFolderId(folder.id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="admin-toolbar">
            <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder={english ? "New subfolder" : "Nueva subcarpeta"} />
            <button
              className="admin-btn"
              type="button"
              onClick={async () => {
                if (!newFolder.trim()) return;
                try {
                  const created = await api<{ id: string }>(`/api/admin/patients/${patientId}/document-folders`, {
                    method: "POST",
                    body: JSON.stringify({ parentKey: "estudios", name: newFolder }),
                  });
                  setNewFolder("");
                  await reload();
                  setFolderId(created.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo crear la carpeta.");
                }
              }}
            >
              {english ? "Add folder" : "Agregar carpeta"}
            </button>
          </div>
        </>
      ) : null}
      <div className="admin-toolbar">
        <input name="title" placeholder={english ? "Title" : "Título"} defaultValue="" />
        <input name="documentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <input name="file" type="file" accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png" required />
        <button className="admin-btn admin-btn--primary" type="submit">{english ? "Upload" : "Subir archivo"}</button>
      </div>
      {visible.map((row) => (
        <div key={row.id} className="admin-table__row comm-row">
          <div>
            {row.missing ? (
              <span>{String(row.title)} · {english ? "file missing, upload it again" : "archivo no disponible, vuelve a subirlo"}</span>
            ) : (
              <a href={`/api/admin/documents/${row.id}`}>{String(row.title || defaultTitle)}</a>
            )}
            <div className="admin-table__cell-sub">{String(row.document_date || String(row.created_at || "").slice(0, 10))}</div>
          </div>
          <button
            className="admin-btn"
            type="button"
            onClick={async () => {
              if (!window.confirm(english ? "Delete this file?" : "¿Eliminar este archivo?")) return;
              await api(`/api/admin/patients/${patientId}/documents`, { method: "DELETE", body: JSON.stringify({ id: row.id }) });
              setDocs(docs.filter((item) => item.id !== row.id));
            }}
          >
            {english ? "Delete" : "Eliminar"}
          </button>
        </div>
      ))}
      {!visible.length ? <p className="admin-table__empty">{english ? "No files in this folder." : "Sin archivos en esta carpeta."}</p> : null}
    </form>
  );
}
