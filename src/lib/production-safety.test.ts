import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAppBaseUrl } from "./app-url";
import { resolveBillingProviderKind } from "./billing/provider";
import { missingProductionConfig } from "./production-config";
import { isAllowedOrigin } from "./security/request";

const PROD_URL = "https://studentlife-ai.vercel.app";

function prodEnv(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:secret@db.example/studentlife",
    AUTH_SECRET: "production-auth-secret-value",
    APP_BASE_URL: PROD_URL,
    NEXT_PUBLIC_APP_URL: PROD_URL,
    AI_PROVIDER: "gemini",
    GEMINI_API_KEY: "gemini-secret-value",
    BILLING_PROVIDER: "none",
    STRIPE_SECRET_KEY: "sk_test_stray",
    STRIPE_WEBHOOK_SECRET: "whsec_stray",
    STRIPE_PRICE_PRO_MONTHLY: "price_month",
    STRIPE_PRICE_PRO_YEARLY: "price_year",
    ...extra,
  } as NodeJS.ProcessEnv;
}

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe("production url safety", () => {
  it("uses localhost only outside production", () => {
    assert.equal(resolveAppBaseUrl({ NODE_ENV: "development" }), "http://localhost:3000");
    assert.equal(
      resolveAppBaseUrl({ NODE_ENV: "test", APP_BASE_URL: "http://localhost:3000" }),
      "http://localhost:3000"
    );
  });

  it("never returns localhost in production", () => {
    assert.throws(
      () => resolveAppBaseUrl({ NODE_ENV: "production" }),
      /APP_BASE_URL and NEXT_PUBLIC_APP_URL are required/
    );
    assert.throws(
      () =>
        resolveAppBaseUrl({
          NODE_ENV: "production",
          APP_BASE_URL: "http://localhost:3000",
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        }),
      /must not be localhost/
    );
    assert.equal(resolveAppBaseUrl(prodEnv()), PROD_URL);
  });

  it("rejects a localhost origin in production", () => {
    const previous = process.env.NODE_ENV;
    setNodeEnv("production");
    process.env.APP_BASE_URL = PROD_URL;
    process.env.NEXT_PUBLIC_APP_URL = PROD_URL;
    try {
      assert.equal(isAllowedOrigin("http://localhost:3000"), false);
      assert.equal(isAllowedOrigin(PROD_URL), true);
    } finally {
      setNodeEnv(previous);
    }
  });
});

describe("explicit billing provider", () => {
  it("keeps BILLING_PROVIDER=none even when Stripe variables exist", () => {
    assert.equal(resolveBillingProviderKind(prodEnv()), "none");
    assert.equal(
      resolveBillingProviderKind(prodEnv({ BILLING_PROVIDER: undefined })),
      "none"
    );
  });

  it("enables Stripe only when BILLING_PROVIDER=stripe and it is configured", () => {
    assert.equal(resolveBillingProviderKind(prodEnv({ BILLING_PROVIDER: "stripe" })), "stripe");
    assert.equal(
      resolveBillingProviderKind({
        NODE_ENV: "production",
        BILLING_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_test_only",
      }),
      "none"
    );
  });

  it("allows dev billing only outside production", () => {
    assert.equal(
      resolveBillingProviderKind({ NODE_ENV: "development", BILLING_PROVIDER: "dev" }),
      "dev"
    );
    assert.equal(
      resolveBillingProviderKind({ NODE_ENV: "test", BILLING_PROVIDER: "dev" }),
      "dev"
    );
    assert.equal(resolveBillingProviderKind(prodEnv({ BILLING_PROVIDER: "dev" })), "none");
  });
});

describe("production env validation", () => {
  it("accepts BILLING_PROVIDER=none without Stripe variables", () => {
    const env = prodEnv();
    delete env.STRIPE_SECRET_KEY;
    delete env.STRIPE_WEBHOOK_SECRET;
    delete env.STRIPE_PRICE_PRO_MONTHLY;
    delete env.STRIPE_PRICE_PRO_YEARLY;
    assert.deepEqual(missingProductionConfig(env), []);
  });

  it("names missing production settings and does not echo secret values", () => {
    const missing = missingProductionConfig({ NODE_ENV: "production", BILLING_PROVIDER: "dev" });
    assert.ok(missing.includes("DATABASE_URL"));
    assert.ok(missing.includes("AUTH_SECRET"));
    assert.ok(missing.includes("GEMINI_API_KEY"));
    assert.ok(missing.includes("BILLING_PROVIDER"));
    const text = missing.join(",");
    assert.equal(text.includes("sk_"), false);
    assert.equal(text.includes("postgresql://"), false);
  });

  it("does not require Stripe variables when billing is none", () => {
    assert.equal(
      missingProductionConfig(prodEnv()).some((name) => name.startsWith("STRIPE_")),
      false
    );
  });
});

describe("dev billing route in production", () => {
  it("returns 404 and does not require a session", async () => {
    const previous = process.env.NODE_ENV;
    setNodeEnv("production");
    process.env.BILLING_PROVIDER = "dev";
    try {
      const { POST } = await import("../app/api/billing/dev/simulate/route");
      const response = await POST(
        new Request("https://studentlife-ai.vercel.app/api/billing/dev/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: PROD_URL },
          body: JSON.stringify({ type: "checkout.completed" }),
        })
      );
      assert.equal(response.status, 404);
      const json = (await response.json()) as { success: boolean };
      assert.equal(json.success, false);
    } finally {
      setNodeEnv(previous);
    }
  });
});
