import { createHmac, createHash, randomBytes } from "crypto";

function salt(envKey: string, fallback: string): string {
  return process.env[envKey] || process.env.AUTH_SECRET || fallback;
}

export function hmacIdentifier(value: string, purpose: string): string {
  const key = salt("RATE_LIMIT_SECRET", "dev-rate-limit-salt");
  return createHmac("sha256", `${key}:${purpose}`).update(value).digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function categorizeUserAgent(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const v = ua.toLowerCase();
  if (v.includes("mobile") || v.includes("android") || v.includes("iphone")) {
    return "mobile";
  }
  if (v.includes("tablet") || v.includes("ipad")) return "tablet";
  return "desktop";
}

export function browserCategory(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const v = ua.toLowerCase();
  if (v.includes("edg/")) return "edge";
  if (v.includes("chrome")) return "chrome";
  if (v.includes("firefox")) return "firefox";
  if (v.includes("safari")) return "safari";
  return "other";
}

export function stripSensitiveQuery(urlOrPath: string): string {
  try {
    const hasHost = urlOrPath.includes("://");
    const u = hasHost
      ? new URL(urlOrPath)
      : new URL(urlOrPath, "https://example.invalid");
    const blocked = ["token", "code", "password", "secret", "session", "key", "auth"];
    for (const p of [...u.searchParams.keys()]) {
      if (blocked.some((b) => p.toLowerCase().includes(b))) {
        u.searchParams.delete(p);
      }
    }
    return `${u.pathname}${u.search}`;
  } catch {
    return urlOrPath.split("?")[0] ?? urlOrPath;
  }
}
