import type { NextConfig } from "next";

/**
 * Security headers (OWASP ASVS-aligned defaults).
 * CSP starts Report-Only — see docs/DEPLOYMENT_SECURITY.md to enforce.
 *
 * Clarity allowlist follows Microsoft Learn CSP guidance:
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp
 * Explicit script-src / connect-src entries are required because those
 * directives override default-src for scripts and XHR/fetch.
 */
const clarityCspSources = [
  "https://*.clarity.ms",
  "https://www.clarity.ms",
  "https://c.bing.com",
].join(" ");

const cspReportOnly = [
  `default-src 'self' ${clarityCspSources}`,
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clarityCspSources}`,
  `connect-src 'self' ${clarityCspSources}`,
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Next 16 blocks 127.0.0.1 from /_next/* (HMR) unless allowlisted.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
