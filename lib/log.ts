type LogLevel = "debug" | "info" | "warn" | "error";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g;
const SENSITIVE_KEY =
  /password|token|secret|email|phone|mobile|nombre|name|address|street|birth|note|ssn|dob|answer|subjective|objective|assessment|body|signature/i;

function redact(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") {
    return value.replace(EMAIL_RE, "[redacted-email]").replace(PHONE_RE, "[redacted-phone]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redact(v, k);
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
