import { completeReaderPayment } from "@/lib/domain/sales";
import { readerErrorText } from "@/lib/square/reader";

function page(title: string, body: string) {
  const safe = (value: string) => value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] || char);
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safe(title)}</title>
</head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f5f0;color:#1a1a1a;font-family:Georgia,serif">
  <main style="width:min(100%,28rem);padding:2rem 1.25rem">
    <h1 style="font-weight:500;font-size:2rem;margin:0 0 0.75rem">${safe(title)}</h1>
    <p style="font-family:sans-serif;line-height:1.5;margin:0 0 1.5rem">${safe(body)}</p>
    <a href="/admin/cobrar" style="font-family:sans-serif;color:#1a1a1a">Volver a cobrar</a>
  </main>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function param(url: URL, name: string) {
  return url.searchParams.get(name) || url.searchParams.get(name.replaceAll(".", "_"));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const encoded = url.searchParams.get("data");
  let state = param(url, "com.squareup.pos.REQUEST_METADATA");
  let squarePaymentId = param(url, "com.squareup.pos.SERVER_TRANSACTION_ID");
  let errorCode = param(url, "com.squareup.pos.ERROR_CODE");
  if (encoded) {
    try {
      const data = JSON.parse(encoded) as { state?: string; transaction_id?: string; status?: string; error_code?: string };
      state = data.state || null;
      squarePaymentId = data.transaction_id || null;
      if (data.status === "error") errorCode = data.error_code || "error";
    } catch {
      return page("Cobro incompleto", "Square devolvió una respuesta que no se pudo leer.");
    }
  }
  if (!state && !squarePaymentId && !errorCode) {
    return page("Falta la app de Square", "Abre Cobrar en el celular o la tablet donde está instalada la app de Square y el lector ya emparejado.");
  }
  if (!state) return page("Cobro incompleto", readerErrorText(errorCode));
  try {
    const result = await completeReaderPayment({ state, squarePaymentId, errorCode });
    return page(result.ok ? "Pago registrado" : "Cobro no completado", result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el pago.";
    return page("Cobro no completado", message);
  }
}
