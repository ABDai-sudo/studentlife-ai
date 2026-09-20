import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPaidAccess, publicPlan } from "./entitlements";
import { verifyDevWebhookSignature, verifyStripeSignature } from "./webhook-signature";
import { createHmac } from "crypto";
import { signDevWebhook } from "./dev-provider";

describe("subscription entitlements", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");

  it("never treats FREE as paid even if status is ACTIVE", () => {
    assert.equal(
      hasPaidAccess(
        {
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodEnd: new Date("2026-10-20"),
        },
        now
      ),
      false
    );
    assert.equal(publicPlan({ plan: "FREE", status: "ACTIVE", currentPeriodEnd: null }), "FREE");
  });

  it("grants access for PRO_MONTHLY while the period is open", () => {
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "ACTIVE",
          currentPeriodEnd: new Date("2026-10-20"),
        },
        now
      ),
      true
    );
  });

  it("does not treat CANCELLED as paid; cancel-at-period-end stays ACTIVE instead", () => {
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_YEARLY",
          status: "CANCELLED",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date("2026-10-01"),
        },
        now
      ),
      false
    );
  });

  it("revokes access after the period ends or on incomplete checkout", () => {
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "ACTIVE",
          currentPeriodEnd: new Date("2026-09-01"),
        },
        now
      ),
      false
    );
    assert.equal(
      hasPaidAccess({ plan: "PRO_MONTHLY", status: "INCOMPLETE", currentPeriodEnd: null }, now),
      false
    );
  });

  it("does not treat PAST_DUE as ACTIVE without a live graceUntil", () => {
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "PAST_DUE",
          currentPeriodEnd: new Date("2026-10-20"),
          graceUntil: null,
        },
        now
      ),
      false
    );
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "PAST_DUE",
          currentPeriodEnd: new Date("2026-10-20"),
          graceUntil: new Date("2026-09-22"),
        },
        now
      ),
      true
    );
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "PAST_DUE",
          currentPeriodEnd: new Date("2026-10-20"),
          graceUntil: new Date("2026-09-19"),
        },
        now
      ),
      false
    );
  });

  it("denies EXPIRED, CANCELLED, and UNPAID even if the period date is still future", () => {
    const future = new Date("2026-10-20");
    assert.equal(
      hasPaidAccess({ plan: "PRO_YEARLY", status: "EXPIRED", currentPeriodEnd: future }, now),
      false
    );
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_YEARLY",
          status: "CANCELLED",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: future,
        },
        now
      ),
      false
    );
    assert.equal(
      hasPaidAccess({ plan: "PRO_MONTHLY", status: "UNPAID", currentPeriodEnd: future }, now),
      false
    );
  });

  it("keeps PRO while ACTIVE including cancel-at-period-end until the period ends", () => {
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "ACTIVE",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date("2026-10-01"),
        },
        now
      ),
      true
    );
    assert.equal(
      hasPaidAccess(
        {
          plan: "PRO_MONTHLY",
          status: "TRIAL",
          currentPeriodEnd: new Date("2026-10-01"),
        },
        now
      ),
      true
    );
  });
});

describe("webhook signatures", () => {
  it("accepts a valid Stripe-style signature and rejects a bad one", () => {
    const secret = "whsec_test";
    const body = '{"id":"evt_1"}';
    const timestamp = 1_700_000_000;
    const v1 = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const ok = verifyStripeSignature(body, `t=${timestamp},v1=${v1}`, secret, 10 ** 12);
    assert.equal(ok.ok, true);
    const bad = verifyStripeSignature(body, `t=${timestamp},v1=deadbeef`, secret, 10 ** 12);
    assert.equal(bad.ok, false);
  });

  it("accepts a signed Dev webhook and rejects unsigned payloads", () => {
    const secret = "dev_secret";
    const body = '{"providerEventId":"1"}';
    const sig = signDevWebhook(body, secret);
    assert.equal(verifyDevWebhookSignature(body, sig, secret), true);
    assert.equal(verifyDevWebhookSignature(body, "nope", secret), false);
  });
});
