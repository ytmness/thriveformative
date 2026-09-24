async function mutateCms<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/cms/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  return data as T;
}

export { mutateCms };
