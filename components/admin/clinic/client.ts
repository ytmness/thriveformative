export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, credentials: "same-origin" });
  if (res.headers.get("content-type")?.includes("application/json")) {
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(body.error || "No se pudo completar la operación.");
    return body;
  }
  if (!res.ok) {
    if (res.status === 413) throw new Error("El archivo es demasiado grande. El máximo es 32 MB.");
    throw new Error("No se pudo completar la operación.");
  }
  return undefined as T;
}
