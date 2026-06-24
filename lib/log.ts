type LogLevel = "debug" | "info" | "warn" | "error";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(EMAIL_RE, "[redacted-email]");
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redact(v);
    }
    return out;
  }
  return value;
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === "test") return false;
  if (level === "debug" && process.env.NODE_ENV === "production") return false;
  return true;
}

function write(level: LogLevel, scope: string, message: string, meta?: unknown) {
  if (!shouldLog(level)) return;
  const prefix = `[${scope}]`;
  const payload = meta !== undefined ? redact(meta) : undefined;
  if (level === "error") {
    console.error(prefix, message, payload ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, payload ?? "");
  } else {
    console.log(prefix, message, payload ?? "");
  }
}

export const log = {
  debug: (scope: string, message: string, meta?: unknown) => write("debug", scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) => write("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) => write("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) => write("error", scope, message, meta),
};
