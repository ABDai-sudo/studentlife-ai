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
  const base = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).origin === new URL(base).origin;
  } catch {
    return false;
  }
}
