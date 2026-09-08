import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVATAR_SELFIE_MAX_CHARS,
  isAvatarSelfieDataUrl,
  normalizeAvatarSelfieInput,
} from "./selfie";

describe("avatar selfie", () => {
  it("accepts compact jpeg data urls", () => {
    const sample = `data:image/jpeg;base64,${"A".repeat(64)}`;
    assert.equal(isAvatarSelfieDataUrl(sample), true);
    assert.equal(normalizeAvatarSelfieInput(sample), sample);
  });

  it("rejects empty, oversized, or non-image payloads", () => {
    assert.equal(normalizeAvatarSelfieInput(""), null);
    assert.equal(normalizeAvatarSelfieInput(null), null);
    assert.equal(isAvatarSelfieDataUrl("https://evil.example/a.png"), false);
    assert.equal(
      isAvatarSelfieDataUrl(`data:image/jpeg;base64,${"A".repeat(AVATAR_SELFIE_MAX_CHARS)}`),
      false
    );
    assert.throws(() => normalizeAvatarSelfieInput("not-an-image"), /INVALID_AVATAR_SELFIE/);
  });
});
