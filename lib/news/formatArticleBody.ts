/** Convierte texto plano del CMS en párrafos para la vista tipo Wikipedia. */
export function formatArticleBody(body: string | null | undefined): string[] {
  if (!body?.trim()) return [];
  return body
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
