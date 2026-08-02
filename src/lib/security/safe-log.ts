const SENSITIVE_KEY =
  /password|passwordhash|token|session|cookie|authorization|secret|apikey|databaseurl|recoverycode|totpsecret|mfa/i;

const MAX_FIELD_LENGTH = 500;

function scrubCrLf(value: string): string {
  return value.replace(/[\r\n\x00]/g, " ").slice(0, MAX_FIELD_LENGTH);
}

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return scrubCrLf(value);
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item, i) => redactValue(String(i), item));
  }
  if (value && typeof value === "object") {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

export function redactObject(
  input: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

export function safeLog(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>
) {
  const payload = {
    message: scrubCrLf(message),
    ...(meta ? redactObject(meta) : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
