import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CURATED_LOGIN_PREVIEWS,
  parseLoginRememberedContext,
  resolveLoginPreview,
} from "./login-preview";

describe("login preview identities", () => {
  it("keeps curated male/female/neutral looks as distinct local artwork, not stereotype palettes", () => {
    const male = CURATED_LOGIN_PREVIEWS.male;
    const female = CURATED_LOGIN_PREVIEWS.female;
    const neutral = CURATED_LOGIN_PREVIEWS.neutral;
    assert.equal(male.artworkSrc, "/login/student-male.png");
    assert.equal(female.artworkSrc, "/login/student-female.png");
    assert.equal(neutral.artworkSrc, "/login/student-neutral.png");
    assert.notEqual(male.artworkSrc, female.artworkSrc);
    assert.notEqual(female.artworkSrc, neutral.artworkSrc);
    assert.notEqual(female.presetId, "coral");
    assert.notEqual(female.presetId, "peach");
    assert.notEqual(male.presetId, "cobalt");
  });

  it("uses saved identity for custom when a real preset exists", () => {
    const preview = resolveLoginPreview("custom", {
      savedPresetId: "ocean",
      savedDisplayName: "Priya Shah",
    });
    assert.equal(preview.presentation, "custom");
    assert.equal(preview.presetId, "ocean");
    assert.equal(preview.displayName, "Priya Shah");
    assert.equal(preview.artworkSrc, "/login/student-custom.png");
  });

  it("allows initials-only custom looks without geometric art", () => {
    const preview = resolveLoginPreview("custom", {
      savedPresetId: null,
      savedDisplayName: "Alex",
    });
    assert.equal(preview.presetId, null);
    assert.equal(preview.displayName, "Alex");
    assert.equal(preview.artworkSrc, "/login/student-custom.png");
  });

  it("falls back to a curated custom look when nothing is saved", () => {
    const preview = resolveLoginPreview("custom", {});
    assert.equal(preview.presetId, "cobalt");
    assert.equal(preview.displayName, "Student");
    assert.equal(preview.artworkSrc, "/login/student-custom.png");
  });

  it("ignores unsafe remembered payloads", () => {
    const parsed = parseLoginRememberedContext({
      presentation: "admin",
      savedPresetId: "not-a-preset",
      savedDisplayName: "student@college.edu",
      examWeekHint: "yes",
    });
    assert.equal(parsed.presentation, undefined);
    assert.equal(parsed.savedPresetId, undefined);
    assert.equal(parsed.savedDisplayName, undefined);
    assert.equal(parsed.examWeekHint, undefined);
  });
});
