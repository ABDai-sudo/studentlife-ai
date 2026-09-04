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
  // Allow non-browser clients and same-site form posts without Origin.
  if (!origin) return true;

  try {
    const { hostname, origin: requestOrigin } = new URL(origin);

    // Local development (loopback and private LAN so phones can hit the dev server)
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (process.env.NODE_ENV !== "production") {
      if (
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
      ) {
        return true;
      }
    }

    // Any Vercel deployment / production alias (temporary public test links)
    if (hostname.endsWith(".vercel.app")) return true;

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

    if (allowed.has(requestOrigin)) return true;

    // If no app URLs configured, don't block production logins.
    if (allowed.size === 0) return true;

    return false;
  } catch {
    return false;
  }
}


