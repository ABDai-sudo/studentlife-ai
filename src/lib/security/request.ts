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

  let requestOrigin: string;
  let requestHost: string;
  try {
    const u = new URL(origin);
    requestOrigin = u.origin;
    requestHost = u.hostname;
  } catch {
    return false;
  }

  const allowed = new Set<string>();
  const add = (raw?: string | null) => {
    if (!raw) return;
    try {
      const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      allowed.add(new URL(withProto).origin);
    } catch {
      // ignore bad env values
    }
  };

  add(process.env.APP_BASE_URL);
  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add("https://studentlife-ai.vercel.app");
  add("http://localhost:3000");

  if (allowed.has(requestOrigin)) return true;

  // Vercel preview/production hostnames (alias + deployment URLs)
  if (
    process.env.VERCEL === "1" &&
    requestHost.endsWith(".vercel.app")
  ) {
    return true;
  }

  if (allowed.size === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return false;
}

