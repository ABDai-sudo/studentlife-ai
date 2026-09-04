import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAvatarSpeech, sanitizeInstitutionName } from "./speech";
import { hashSeed, isApprovedCampusSlang, pickCampusSlang } from "./campus-slang";

describe("campus slang", () => {
  it("picks the same approved line for the same seed", () => {
    const a = pickCampusSlang("user_abc:2026-09-03");
    const b = pickCampusSlang("user_abc:2026-09-03");
    assert.ok(a);
    assert.equal(a, b);
    assert.equal(isApprovedCampusSlang(a), true);
  });

  it("varies across seeds without Math.random", () => {
    const seen = new Set([
      pickCampusSlang("alpha"),
      pickCampusSlang("beta"),
      pickCampusSlang("gamma"),
      pickCampusSlang("delta"),
    ]);
    assert.ok(seen.size >= 2);
    assert.notEqual(hashSeed("alpha"), hashSeed("beta"));
  });
});

describe("institution sanitizer", () => {
  it("keeps a normal college name", () => {
    assert.equal(
      sanitizeInstitutionName("Delhi Technological University"),
      "Delhi Technological University"
    );
  });

  it("drops private or oversized values", () => {
    assert.equal(sanitizeInstitutionName("student@college.edu"), null);
    assert.equal(sanitizeInstitutionName("GPA 9.1 College"), null);
    assert.equal(sanitizeInstitutionName("₹5000 leftover"), null);
    assert.equal(sanitizeInstitutionName("a".repeat(80)), null);
  });
});

describe("getAvatarSpeech", () => {
  it("uses the specified Bro copy for each budget band", () => {
    assert.match(
      getAvatarSpeech({
        budget: "rich",
        examSeasonActive: false,
        campusSlang: false,
        broModeEnabled: true,
        seed: "s1",
      }).text,
      /We are up, bro/
    );
    assert.match(
      getAvatarSpeech({
        budget: "mid",
        examSeasonActive: false,
        campusSlang: false,
        broModeEnabled: true,
        seed: "s1",
      }).text,
      /Chillin' bro/
    );
    assert.match(
      getAvatarSpeech({
        budget: "cooked",
        examSeasonActive: false,
        campusSlang: false,
        broModeEnabled: true,
        seed: "s1",
      }).text,
      /wallet is down bad/
    );
  });

  it("uses professional copy when Bro is off", () => {
    const result = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: false,
      campusSlang: false,
      broModeEnabled: false,
      seed: "s1",
    });
    assert.match(result.text, /budget is stable/i);
    assert.equal(result.text.includes("bro"), false);
  });

  it("appends only approved slang when enabled", () => {
    const result = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: false,
      campusSlang: true,
      broModeEnabled: true,
      seed: "stable-seed",
    });
    assert.ok(result.slangLine);
    assert.equal(isApprovedCampusSlang(result.slangLine), true);
    assert.ok(result.text.endsWith(result.slangLine));
  });

  it("omits slang when disabled or seed is empty", () => {
    const off = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: false,
      campusSlang: false,
      broModeEnabled: false,
      seed: "stable-seed",
    });
    assert.equal(off.slangLine, null);
    const empty = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: false,
      campusSlang: true,
      broModeEnabled: false,
      seed: "",
    });
    assert.equal(empty.slangLine, null);
  });

  it("appends exam copy only with a safe institution name", () => {
    const ok = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: true,
      institutionName: "NIT Trichy",
      campusSlang: false,
      broModeEnabled: false,
      seed: "s1",
    });
    assert.equal(
      ok.examLine,
      "Also, your NIT Trichy study material is ready. Time to lock in."
    );

    const blocked = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: true,
      institutionName: "dean@nit.edu",
      campusSlang: false,
      broModeEnabled: false,
      seed: "s1",
    });
    assert.equal(blocked.examLine, null);
    assert.equal(blocked.text.includes("@"), false);
  });

  it("mentions model papers only when authenticated papers exist", () => {
    const withPapers = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: true,
      institutionName: "NIT Trichy",
      campusSlang: false,
      broModeEnabled: false,
      seed: "s1",
      hasModelPapers: true,
    });
    assert.equal(withPapers.papersLine, "Your model papers are ready.");

    const without = getAvatarSpeech({
      budget: "mid",
      examSeasonActive: true,
      institutionName: "NIT Trichy",
      campusSlang: false,
      broModeEnabled: false,
      seed: "s1",
      hasModelPapers: false,
    });
    assert.equal(without.papersLine, null);
    assert.equal(without.text.includes("model papers"), false);
  });

  it("never includes wallet amounts", () => {
    const result = getAvatarSpeech({
      budget: "cooked",
      examSeasonActive: true,
      institutionName: "IIT Delhi",
      campusSlang: true,
      broModeEnabled: true,
      seed: "s1",
      hasModelPapers: true,
    });
    assert.equal(result.text.includes("₹"), false);
    assert.equal(/\d+\.\d{2}/.test(result.text), false);
  });
});
