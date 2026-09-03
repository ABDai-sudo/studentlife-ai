import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  recapShareHasPrivateFields,
  sanitizeRecapForShare,
  visibleStudyStatus,
  publicDisplayName,
} from "./privacy";

describe("Campus Circle recap sanitization", () => {
  it("keeps only study volume stats", () => {
    const out = sanitizeRecapForShare({
      studyMinutes: 90,
      tasksCompleted: 3,
      quizzesCompleted: 2,
      currentStreak: 5,
      moneySaved: 1200,
      averageScore: 88,
      email: "hidden@example.com",
      displayName: "Should not leak",
      xpTotal: 400,
      academicAura: 70,
      level: 4,
    });
    assert.deepEqual(out, {
      studyMinutes: 90,
      tasksCompleted: 3,
      quizzesCompleted: 2,
      currentStreak: 5,
    });
    assert.equal(recapShareHasPrivateFields(out as unknown as Record<string, unknown>), false);
  });

  it("flags private recap keys", () => {
    assert.equal(recapShareHasPrivateFields({ moneySaved: 10 }), true);
    assert.equal(recapShareHasPrivateFields({ studyMinutes: 10 }), false);
  });
});

describe("Campus Circle study status visibility", () => {
  it("hides status unless the student opts in", () => {
    assert.equal(
      visibleStudyStatus({ shareStudyStatus: false, studyStatus: "FOCUSING" }),
      null
    );
    assert.equal(
      visibleStudyStatus({ shareStudyStatus: true, studyStatus: "HIDDEN" }),
      null
    );
    assert.equal(
      visibleStudyStatus({ shareStudyStatus: true, studyStatus: "FOCUSING" }),
      "FOCUSING"
    );
  });
});

describe("Campus Circle public names", () => {
  it("never falls back to an email", () => {
    assert.equal(publicDisplayName(null), "Student");
    assert.equal(publicDisplayName("  Priya  "), "Priya");
  });
});
