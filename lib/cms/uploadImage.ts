import { createClient } from "@/lib/supabase";
import type { Locale } from "@/lib/cms/types";

const BUCKET = "cms-images";
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

export async function uploadCmsImage(file: File, locale: Locale): Promise<string> {
  const validation = validateCmsImageFile(file);
  if (validation) throw new Error(validation);

  const supabase = createClient();
  const extFromName = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const ext =
    extFromName === "jpeg" ? "jpg" : ["jpg", "png", "webp", "gif"].includes(extFromName) ? extFromName : "jpg";

  const path = `${locale}/articles/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message || "No se pudo subir la imagen.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
