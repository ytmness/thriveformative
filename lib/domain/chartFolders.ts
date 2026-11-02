import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { DEFAULT_STUDY_FOLDERS } from "@/lib/domain/chartFolderMeta";

export {
  CHART_FOLDERS,
  DEFAULT_STUDY_FOLDERS,
  FOLDER_LABELS,
  NOTE_FOLDERS,
  defaultDocumentTitle,
  folderLabel,
  isNoteFolder,
} from "@/lib/domain/chartFolderMeta";
export type { ChartFolderKey, NoteFolderKey } from "@/lib/domain/chartFolderMeta";

export async function ensureStudyFolders(patientId: string) {
  for (const folder of DEFAULT_STUDY_FOLDERS) {
    await query(
      `INSERT INTO patient_document_folders (patient_id, parent_key, name, slug)
       VALUES ($1, 'estudios', $2, $3)
       ON CONFLICT (patient_id, parent_key, slug) DO NOTHING`,
      [patientId, folder.es, folder.slug]
    );
  }
}

export async function listDocumentFolders(patientId: string, parentKey: string) {
  if (parentKey === "estudios") await ensureStudyFolders(patientId);
  const rows = await query<{ id: string; name: string; slug: string; parent_key: string; created_at: string }>(
    `SELECT id, name, slug, parent_key, created_at
     FROM patient_document_folders
     WHERE patient_id = $1 AND parent_key = $2
     ORDER BY created_at ASC, name ASC`,
    [patientId, parentKey]
  );
  return rows.rows;
}

export async function createDocumentFolder(patientId: string, parentKey: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new DomainError("El nombre de la carpeta es obligatorio.");
  const slug = slugify(trimmed);
  const inserted = await query<{ id: string }>(
    `INSERT INTO patient_document_folders (patient_id, parent_key, name, slug)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (patient_id, parent_key, slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [patientId, parentKey, trimmed, slug]
  );
  return { id: inserted.rows[0].id };
}

function slugify(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `carpeta-${Date.now()}`;
}
