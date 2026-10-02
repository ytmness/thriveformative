import { getSquareLocation, SquareApiError } from "@/lib/square/client";
import { getSquareCredentials, squareWebSdkUrl, SquareConfigError } from "@/lib/square/config";
import { jsonError, jsonOk, handleRouteError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const credentials = getSquareCredentials();
    const location = await getSquareLocation();
    return jsonOk({
      environment: credentials.environment,
      applicationId: credentials.applicationId,
      locationId: location.id,
      currency: location.currency,
      sdkUrl: squareWebSdkUrl(credentials.environment),
    });
  } catch (error) {
    if (error instanceof SquareConfigError) {
      return jsonError(503, "El pago con tarjeta no está disponible en este momento.");
    }
    if (error instanceof SquareApiError) {
      return jsonError(502, "No se pudo preparar el pago con Square.");
    }
    return handleRouteError("square-checkout-context", error);
  }
}
