import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapLoginFailure, safePostLoginPath } from "./login-errors";

describe("login error mapping", () => {
  it("never distinguishes missing accounts from bad passwords", () => {
    assert.equal(
      mapLoginFailure({ ok: false, status: 401, code: "INVALID_CREDENTIALS" }),
      "login.error.invalid"
    );
    assert.equal(
      mapLoginFailure({ ok: false, status: 401, code: "USER_NOT_FOUND" }),
      "login.error.invalid"
    );
  });

  it("maps rate limits and outages without raw server text", () => {
    assert.equal(
      mapLoginFailure({ ok: false, status: 429, code: "RATE_LIMITED" }),
      "login.error.rateLimited"
    );
    assert.equal(
      mapLoginFailure({ ok: false, status: 500, code: "INTERNAL_ERROR" }),
      "login.error.server"
    );
  });

  it("treats validation failures as generic credential errors", () => {
    assert.equal(
      mapLoginFailure({ ok: false, status: 422, code: "VALIDATION_ERROR" }),
      "login.error.invalid"
    );
  });
});

describe("post-login redirect", () => {
  it("sends incomplete onboarding to /onboarding", () => {
    assert.equal(safePostLoginPath("/dashboard", false), "/onboarding");
  });

  it("honors a safe next path after onboarding", () => {
    assert.equal(
      safePostLoginPath("/dashboard/profile", true),
      "/dashboard/profile"
    );
  });

  it("rejects open redirects", () => {
    assert.equal(safePostLoginPath("//evil.test", true), "/dashboard");
    assert.equal(safePostLoginPath("https://evil.test", true), "/dashboard");
    assert.equal(safePostLoginPath("/login", true), "/dashboard");
  });
});
