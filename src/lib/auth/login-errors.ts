import type { MessageKey } from "@/lib/i18n/dictionaries/en";

export type LoginFailureInput = {
  ok: boolean;
  status: number;
  code?: string | null;
};

/**
 * Map login HTTP failures to professional copy.
 * Never surfaces raw server text (DB, AUTH_SECRET, stack traces).
 * Never distinguishes missing accounts from bad passwords.
 */
export function mapLoginFailure(input: LoginFailureInput): MessageKey {
  if (input.status === 429 || input.code === "RATE_LIMITED") {
    return "login.error.rateLimited";
  }
  if (input.status >= 500 || input.code === "INTERNAL_ERROR") {
    return "login.error.server";
  }
  if (
    input.status === 401 ||
    input.code === "INVALID_CREDENTIALS" ||
    input.code === "VALIDATION_ERROR" ||
    input.status === 422
  ) {
    return "login.error.invalid";
  }
  if (!input.ok) return "login.error.invalid";
  return "login.error.invalid";
}

const INTERNAL_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/settings",
  "/admin",
];

/** Honor proxy `?next=` only for same-origin app paths. */
export function safePostLoginPath(
  raw: string | null | undefined,
  onboardingComplete: boolean
): string {
  if (!onboardingComplete) return "/onboarding";
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/dashboard";
  }
  if (raw.includes("://") || raw.includes("\0")) return "/dashboard";
  const path = raw.split(/[?#]/)[0] ?? raw;
  const allowed = INTERNAL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  return allowed ? path : "/dashboard";
}
