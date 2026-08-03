import { headers } from "next/headers";
import { randomUUID } from "crypto";
import {
  browserCategory,
  categorizeUserAgent,
  hmacIdentifier,
} from "@/lib/security/hash";

export async function getRequestContext() {
  const h = await headers();
  const requestId =
    h.get("x-request-id") || h.get("x-correlation-id") || randomUUID();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent");
  return {
    requestId,
    ipHash: hmacIdentifier(ip, "ip"),
    userAgentCat: categorizeUserAgent(ua),
    browserCat: browserCategory(ua),
    origin: h.get("origin"),
    referer: h.get("referer"),
  };
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // non-browser clients

  const candidates = [
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
  ].filter(Boolean) as string[];

  if (candidates.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const requestOrigin = new URL(origin).origin;
    return candidates.some((base) => {
      try {
        return new URL(base).origin === requestOrigin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
