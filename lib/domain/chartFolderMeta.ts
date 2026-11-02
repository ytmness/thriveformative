export const NOTE_FOLDERS = ["plan90", "prioridades", "desequilibrios"] as const;
export type NoteFolderKey = (typeof NOTE_FOLDERS)[number];

export const CHART_FOLDERS = [
  "plan90",
  "sesiones",
  "prioridades",
  "desequilibrios",
  "medicamentos",
  "estudios",
  "composicion",
  "nutricionales",
] as const;
export type ChartFolderKey = (typeof CHART_FOLDERS)[number];

export const FOLDER_LABELS: Record<ChartFolderKey, { es: string; en: string }> = {
  plan90: { es: "Plan de 90 días", en: "90-day plan" },
  sesiones: { es: "Sesiones", en: "Sessions" },
  prioridades: { es: "Prioridades Funcionales", en: "Functional Priorities" },
  desequilibrios: { es: "Desequilibrios Iniciales", en: "Initial Imbalances" },
  medicamentos: { es: "Medicamentos Activos, Suplementos y Alergias", en: "Active Medications, Supplements and Allergies" },
  estudios: { es: "Estudios Clínicos", en: "Clinical Studies" },
  composicion: { es: "Body Composition Análisis", en: "Body Composition Analysis" },
  nutricionales: { es: "Planes Nutricionales y Protocolos", en: "Nutrition Plans and Protocols" },
};

export const DEFAULT_STUDY_FOLDERS = [
  { slug: "imaging", es: "Imagenología", en: "Imaging" },
  { slug: "labs", es: "Sangre / orina / saliva", en: "Blood / urine / saliva" },
  { slug: "microbiota", es: "Microbiota", en: "Microbiome" },
  { slug: "procedures", es: "Procedimientos", en: "Procedures" },
  { slug: "otros", es: "Otros", en: "Other" },
] as const;

export function folderLabel(key: string, english: boolean) {
  const found = FOLDER_LABELS[key as ChartFolderKey];
  if (!found) return key;
  return english ? found.en : found.es;
}

export function defaultDocumentTitle(folderKey: string, english: boolean, now = new Date()) {
  const date = now.toLocaleDateString(english ? "en-US" : "es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${folderLabel(folderKey, english)} — ${date}`;
}

export function isNoteFolder(key: string): key is NoteFolderKey {
  return (NOTE_FOLDERS as readonly string[]).includes(key);
}
