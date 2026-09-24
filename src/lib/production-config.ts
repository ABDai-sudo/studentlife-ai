import { resolveAppBaseUrl } from "./app-url";

export class ProductionConfigError extends Error {
  readonly code = "PRODUCTION_CONFIG_INVALID" as const;
  readonly missing: readonly string[];
  constructor(missing: string[]) {
    super(
      missing.length
        ? `Production configuration is incomplete: ${missing.join(", ")}`
        : "Production configuration is invalid."
    );
    this.name = "ProductionConfigError";
    this.missing = missing;
  }
}

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "APP_BASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "AI_PROVIDER",
  "GEMINI_API_KEY",
  "BILLING_PROVIDER",
] as const;

const STRIPE_WHEN_ENABLED = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PRO_YEARLY",
] as const;

const AI_PROVIDERS = new Set(["gemini", "openai", "rules"]);

function present(env: NodeJS.ProcessEnv, name: string): boolean {
  return Boolean(env[name]?.trim());
}

/** Names only. Never includes secret values. */
export function missingProductionConfig(
  env: NodeJS.ProcessEnv = process.env
): string[] {
  if (env.NODE_ENV !== "production") return [];

  const missing: string[] = [];
  for (const name of REQUIRED) {
    if (!present(env, name)) missing.push(name);
  }
  if (present(env, "AUTH_SECRET") && (env.AUTH_SECRET?.trim().length ?? 0) < 16) {
    missing.push("AUTH_SECRET");
  }

  const billing = env.BILLING_PROVIDER?.trim().toLowerCase();
  if (billing === "dev") missing.push("BILLING_PROVIDER");
  if (billing && billing !== "none" && billing !== "stripe" && billing !== "dev") {
    missing.push("BILLING_PROVIDER");
  }
  if (billing === "stripe") {
    for (const name of STRIPE_WHEN_ENABLED) {
      if (!present(env, name)) missing.push(name);
    }
  }

  const ai = env.AI_PROVIDER?.trim().toLowerCase();
  if (ai && !AI_PROVIDERS.has(ai)) missing.push("AI_PROVIDER");

  try {
    if (present(env, "APP_BASE_URL") && present(env, "NEXT_PUBLIC_APP_URL")) {
      resolveAppBaseUrl(env);
    }
  } catch {
    if (!missing.includes("APP_BASE_URL")) missing.push("APP_BASE_URL");
    if (!missing.includes("NEXT_PUBLIC_APP_URL")) missing.push("NEXT_PUBLIC_APP_URL");
  }

  return [...new Set(missing)];
}

export function assertProductionConfig(env: NodeJS.ProcessEnv = process.env): void {
  const missing = missingProductionConfig(env);
  if (missing.length) throw new ProductionConfigError(missing);
}
