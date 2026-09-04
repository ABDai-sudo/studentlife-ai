import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAvatarShareText, shareTextLooksPrivate } from "./share-payload";

describe("avatar share payload", () => {
  it("includes only name, status, and streak — never a budget band", () => {
    const text = buildAvatarShareText({
      displayName: "VerifyStudent",
      status: "Exam mode",
      budget: "mid",
      streak: 4,
    });
    assert.equal(
      text,
      "VerifyStudent · StudentLife · Exam mode · 4-day streak"
    );
    assert.equal(text.toLowerCase().includes("budget"), false);
    assert.equal(shareTextLooksPrivate(text), false);
  });

  it("drops private-looking status and never inlines money or budget", () => {
    const text = buildAvatarShareText({
      displayName: "Aisha",
      status: "₹1200 left",
      budget: "cooked",
      streak: 2,
    });
    assert.equal(text.includes("₹"), false);
    assert.equal(text.includes("1200"), false);
    assert.equal(text.toLowerCase().includes("budget"), false);
    assert.equal(text.includes("tight"), false);
    assert.equal(shareTextLooksPrivate(text), false);
  });

  it("flags accidental money or email copy", () => {
    assert.equal(shareTextLooksPrivate("left 250.00 this month"), true);
    assert.equal(shareTextLooksPrivate("email me@college.edu"), true);
    assert.equal(shareTextLooksPrivate("Budget: tight"), true);
  });
});
