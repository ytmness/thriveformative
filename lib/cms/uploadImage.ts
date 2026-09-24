import type { Locale } from "@/lib/cms/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateCmsImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Formato no válido. Usa JPG, PNG, WebP o GIF.";
  }
  if (file.size > MAX_BYTES) {
    return "La imagen no puede superar 5 MB.";
  }
  return null;
}

export type CmsImageFolder = "articles" | "products";

export async function uploadCmsImage(
  file: File,
  locale: Locale,
  folder: CmsImageFolder = "articles"
): Promise<string> {
  const validation = validateCmsImageFile(file);
  if (validation) throw new Error(validation);

  const form = new FormData();
  form.set("file", file);
  form.set("locale", locale);
  form.set("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "No se pudo subir la imagen.");
  }
  return (body as { url: string }).url;
}
