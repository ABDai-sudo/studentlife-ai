export class AppUrlConfigError extends Error {
  readonly code = "APP_URL_CONFIG_REQUIRED" as const;
  constructor(message: string) {
    super(message);
    this.name = "AppUrlConfigError";
  }
}

const DEV_FALLBACK = "http://localhost:3000";

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function parseConfiguredUrl(raw: string | undefined): URL | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Canonical app origin. Development may use localhost. Production must be configured. */
export function resolveAppBaseUrl(
  env: NodeJS.ProcessEnv = process.env
): string {
  const production = env.NODE_ENV === "production";
  const fromApp = parseConfiguredUrl(env.APP_BASE_URL);
  const fromPublic = parseConfiguredUrl(env.NEXT_PUBLIC_APP_URL);
  const chosen = fromApp ?? fromPublic;

  if (!production) {
    if (!chosen || isLocalHost(chosen.hostname)) return DEV_FALLBACK;
    return chosen.origin;
  }

  if (!fromApp || !fromPublic) {
    throw new AppUrlConfigError(
      "APP_BASE_URL and NEXT_PUBLIC_APP_URL are required in production."
    );
  }
  for (const url of [fromApp, fromPublic]) {
    if (url.protocol !== "https:" || isLocalHost(url.hostname)) {
      throw new AppUrlConfigError(
        "APP_BASE_URL and NEXT_PUBLIC_APP_URL must be https and must not be localhost in production."
      );
    }
  }
  return fromApp.origin;
}
