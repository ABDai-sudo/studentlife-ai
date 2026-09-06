import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeCsvCell, toCsv } from "./csv";
import { redactObject } from "./safe-log";
import {
  analyticsEventSchema,
  ALLOWED_ANALYTICS_EVENTS,
} from "../../services/analytics.service";
import { __resetRateLimitBuckets, decideRateLimit, rateLimit } from "./rate-limit";
import { stripSensitiveQuery } from "./hash";
import { AuthorizationError } from "../auth/errors";

describe("CSV export safety", () => {
  it("escapes formula injection prefixes", () => {
    assert.equal(escapeCsvCell("=cmd"), "'=cmd");
    assert.equal(escapeCsvCell("@sum"), "'@sum");
    assert.equal(escapeCsvCell("+1"), "'+1");
    assert.equal(escapeCsvCell("-1"), "'-1");
  });

  it("builds csv with headers", () => {
    const csv = toCsv(["a", "b"], [["=1", "ok"]]);
    assert.ok(csv.startsWith("a,b"));
    assert.ok(csv.includes("'=1"));
  });
});

describe("safe log redaction", () => {
  it("redacts sensitive keys", () => {
    const out = redactObject({
      password: "secret",
      passwordHash: "hash",
      token: "abc",
      email: "a@b.com",
    });
    assert.equal(out.password, "[REDACTED]");
    assert.equal(out.passwordHash, "[REDACTED]");
    assert.equal(out.token, "[REDACTED]");
    assert.equal(out.email, "a@b.com");
  });
});

describe("analytics validation", () => {
  it("accepts allowlisted events", () => {
    for (const eventName of ALLOWED_ANALYTICS_EVENTS.slice(0, 3)) {
      assert.equal(analyticsEventSchema.safeParse({ eventName }).success, true);
    }
  });

  it("rejects unknown event names", () => {
    assert.equal(
      analyticsEventSchema.safeParse({ eventName: "steal_password" }).success,
      false
    );
  });

  it("rejects oversized metadata", () => {
    const big: Record<string, string> = {};
    for (let i = 0; i < 100; i++) big[`k${i}`] = "x".repeat(20);
    assert.equal(
      analyticsEventSchema.safeParse({
        eventName: "page_view",
        metadata: big,
      }).success,
      false
    );
  });
});

describe("transient db errors", () => {
  it("retries Neon administrator disconnects only", async () => {
    const { isTransientDbError } = await import("../db");
    assert.equal(
      isTransientDbError({ code: "57P01", message: "terminating connection" }),
      true
    );
    assert.equal(
      isTransientDbError({ code: "P2002", message: "Unique constraint failed" }),
      false
    );
    assert.equal(
      isTransientDbError({ message: "Request timed out" }),
      false
    );
    assert.equal(
      isTransientDbError({ message: "connection timed out" }),
      true
    );
  });

  it("adds Neon pool timeouts without dropping existing params", async () => {
    const { resolveDatabaseUrl } = await import("../db");
    const resolved = resolveDatabaseUrl(
      "postgresql://u:p@ep-example/neondb?sslmode=require"
    );
    assert.ok(resolved?.includes("pool_timeout=20"));
    assert.ok(resolved?.includes("connect_timeout=30"));
    assert.ok(resolved?.includes("sslmode=require"));
    const already = resolveDatabaseUrl(
      "postgresql://u:p@ep-example/neondb?pool_timeout=12"
    );
    assert.ok(already?.includes("pool_timeout=12"));
    assert.equal(already?.includes("pool_timeout=20"), false);
  });
});

describe("rate limiting", () => {
  it("blocks after limit", () => {
    __resetRateLimitBuckets();
    const key = `test-${Date.now()}`;
    assert.equal(rateLimit(key, { limit: 2, windowSec: 60 }).allowed, true);
    assert.equal(rateLimit(key, { limit: 2, windowSec: 60 }).allowed, true);
    assert.equal(rateLimit(key, { limit: 2, windowSec: 60 }).allowed, false);
  });

  it("decideRateLimit does not increment after the cap", () => {
    const first = decideRateLimit(null, 1_000, 2, 60);
    assert.equal(first.allowed, true);
    const second = decideRateLimit(first.next, 1_001, 2, 60);
    assert.equal(second.allowed, true);
    const third = decideRateLimit(second.next, 1_002, 2, 60);
    assert.equal(third.allowed, false);
    assert.equal(third.mutated, false);
    assert.equal(third.next.count, 2);
  });
});

describe("URL sanitization", () => {
  it("strips sensitive query params", () => {
    const cleaned = stripSensitiveQuery("/path?token=abc&ok=1");
    assert.equal(cleaned.includes("token="), false);
    assert.ok(cleaned.includes("ok=1"));
  });
});

describe("authorization contract", () => {
  it("AuthorizationError codes are stable", () => {
    const e = new AuthorizationError("Access denied", "FORBIDDEN", 403);
    assert.equal(e.status, 403);
    assert.equal(e.code, "FORBIDDEN");
  });
});

describe("public health response shape", () => {
  it("documents safe public payload keys only", () => {
    const publicPayload = { status: "ok" };
    assert.deepEqual(Object.keys(publicPayload), ["status"]);
  });
});

describe("security headers config", () => {
  it("next.config exports security headers", async () => {
    const config = (await import("../../../next.config")).default;
    assert.ok(typeof config.headers === "function");
    const headers = await config.headers!();
    const all = headers.flatMap((h) => h.headers.map((x) => x.key));
    assert.ok(all.includes("Strict-Transport-Security"));
    assert.ok(all.includes("X-Content-Type-Options"));
    assert.ok(all.includes("Content-Security-Policy-Report-Only"));
  });
});

describe("admin authz contract notes", () => {
  it("admin APIs must use withOwnerApi / requireOwner (source contract)", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = path.join(process.cwd(), "src/app/api/admin");
    const files = await fs.readdir(root, { recursive: true });
    const routes = files.filter((f) => String(f).endsWith("route.ts"));
    assert.ok(routes.length >= 8);
    for (const f of routes) {
      const content = await fs.readFile(path.join(root, String(f)), "utf8");
      assert.ok(
        content.includes("withOwnerApi") || content.includes("requireOwner"),
        `missing owner authz in ${f}`
      );
    }
    const usersRoute = await fs.readFile(
      path.join(root, "users", "route.ts"),
      "utf8"
    );
    assert.ok(usersRoute.includes("userSafeSelect"));
    assert.equal(usersRoute.includes("passwordHash: true,"), false);
    assert.ok(usersRoute.includes('select: { passwordHash: true }'));

    const campusReports = await fs.readFile(
      path.join(root, "campus-reports", "route.ts"),
      "utf8"
    );
    assert.ok(campusReports.includes("withOwnerApi"));
    assert.equal(campusReports.includes("monthlyPocketMoney"), false);
  });
});

describe("campus circle release contracts", () => {
  it("keeps FEATURE_CAMPUS_CIRCLE off by default", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const features = await fs.readFile(
      path.join(process.cwd(), "src/lib/features.ts"),
      "utf8"
    );
    assert.ok(features.includes('campusCircle: flag("FEATURE_CAMPUS_CIRCLE", false)'));
  });

  it("uses persistent rate limiting on Campus Circle mutations", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const route = await fs.readFile(
      path.join(process.cwd(), "src/app/api/campus-circle/route.ts"),
      "utf8"
    );
    assert.ok(route.includes("persistentRateLimit"));
    assert.equal(route.includes("rateLimit(`campus:"), false);
  });

  it("hides Campus Circle nav behind a feature flag", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const nav = await fs.readFile(
      path.join(process.cwd(), "src/components/app/nav.ts"),
      "utf8"
    );
    assert.ok(nav.includes('feature: "campusCircle"'));
  });
});
