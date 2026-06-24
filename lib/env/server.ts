export type SmtpEnv = {
  host: string;
  port: number;
  secure: boolean;
  user: string | undefined;
  pass: string | undefined;
  rejectUnauthorized: boolean;
};

export function getNotifyEmail(): string | undefined {
  const value = process.env.NOTIFY_EMAIL?.trim();
  return value || undefined;
}

export function requireNotifyEmail(): string {
  const email = getNotifyEmail();
  if (!email) {
    throw new Error("NOTIFY_EMAIL no está configurado en el servidor.");
  }
  return email;
}

export function getComingSoonPassword(): string | undefined {
  const value = process.env.COMING_SOON_PASSWORD;
  return value && value.length > 0 ? value : undefined;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://thriveformative.com"
  );
}

export function getSmtpEnv(): SmtpEnv {
  return {
    host: process.env.SMTP_HOST?.trim() || "localhost",
    port: Number(process.env.SMTP_PORT || "25"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: process.env.SMTP_PASS || undefined,
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  };
}

export function getServiceRoleKey(): string | undefined {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || undefined;
}
