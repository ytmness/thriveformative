export type SquareEnvironment = "sandbox" | "production";

export class SquareConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SquareConfigError";
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getSquareEnvironment(): SquareEnvironment {
  const raw = (readEnv("SQUARE_ENVIRONMENT") || readEnv("SQUARE_ENV") || "sandbox").toLowerCase();
  return raw === "production" ? "production" : "sandbox";
}

export function squareApiBase(environment: SquareEnvironment): string {
  return environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export function squareWebSdkUrl(environment: SquareEnvironment): string {
  return environment === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";
}

function isProductionApplicationId(value: string): boolean {
  return value.startsWith("sq0idp-");
}

function isSandboxApplicationId(value: string): boolean {
  return value.startsWith("sandbox-");
}

export type SquareCredentials = {
  environment: SquareEnvironment;
  applicationId: string;
  accessToken: string;
  locationId: string | undefined;
};

/**
 * Lee el par de credenciales del ambiente activo.
 * Acepta nombres genéricos y nombres separados por ambiente, para el .env del servidor.
 */
export function getSquareCredentials(): SquareCredentials {
  const environment = getSquareEnvironment();
  const prefix = environment === "production" ? "SQUARE_PRODUCTION" : "SQUARE_SANDBOX";

  const scopedApplicationId = readEnv(`${prefix}_APPLICATION_ID`);
  const scopedAccessToken = readEnv(`${prefix}_ACCESS_TOKEN`);
  const scopedLocationId = readEnv(`${prefix}_LOCATION_ID`);

  let applicationId = scopedApplicationId || readEnv("SQUARE_APPLICATION_ID");
  let accessToken = scopedAccessToken || readEnv("SQUARE_ACCESS_TOKEN");
  const locationId = scopedLocationId || readEnv("SQUARE_LOCATION_ID");

  if (applicationId) {
    const wrongEnvironment =
      (environment === "sandbox" && isProductionApplicationId(applicationId)) ||
      (environment === "production" && isSandboxApplicationId(applicationId));
    if (wrongEnvironment && !scopedApplicationId) {
      applicationId = undefined;
    }
  }

  const missing: string[] = [];
  if (!applicationId) missing.push(`${prefix}_APPLICATION_ID o SQUARE_APPLICATION_ID`);
  if (!accessToken) missing.push(`${prefix}_ACCESS_TOKEN o SQUARE_ACCESS_TOKEN`);
  if (missing.length) {
    throw new SquareConfigError(
      `Faltan credenciales de Square (${environment}): ${missing.join(", ")}.`
    );
  }

  return {
    environment,
    applicationId: applicationId as string,
    accessToken: accessToken as string,
    locationId,
  };
}
