import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  civilDaysBetween,
  isCurrentClassSlot,
  isLiveStudySession,
  LIVE_SESSION_MAX_MS,
  parseHmToMinutes,
  publicIdentityStatus,
  resolveStudentStatus,
  statusLooksPrivate,
  presenceFromCampusStudyStatus,
  zonedClock,
} from "./contextual-status";
import { isValidAvatarStatus } from "./presets";

describe("contextual clock and timetable", () => {
  it("parses HH:mm into minutes", () => {
    assert.equal(parseHmToMinutes("09:30"), 9 * 60 + 30);
    assert.equal(parseHmToMinutes("9:05"), 9 * 60 + 5);
    assert.equal(parseHmToMinutes("24:00"), null);
    assert.equal(parseHmToMinutes("Math 101"), null);
  });

  it("matches a class slot without exposing the title", () => {
    assert.equal(
      isCurrentClassSlot({
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "11:00",
        nowWeekday: 1,
        nowMinutes: 10 * 60 + 15,
      }),
      true
    );
    assert.equal(
      isCurrentClassSlot({
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "11:00",
        nowWeekday: 2,
        nowMinutes: 10 * 60 + 15,
      }),
      false
    );
  });

  it("computes Asia/Kolkata civil day keys", () => {
    const clock = zonedClock(
      "Asia/Kolkata",
      new Date("2026-09-03T06:30:00.000Z")
    );
    assert.equal(clock.dayKey, "2026-09-03");
    assert.equal(clock.weekday, 4);
    assert.equal(clock.minutes, 12 * 60);
  });

  it("counts civil days without timestamps leaking", () => {
    assert.equal(civilDaysBetween("2026-09-03", "2026-09-10"), 7);
    assert.equal(civilDaysBetween("2026-09-03", "2026-09-03"), 0);
    assert.equal(civilDaysBetween("2026-09-03", "2026-09-02"), -1);
  });
});

describe("live study sessions", () => {
  const now = new Date("2026-09-03T08:00:00.000Z");

  it("treats an open recent session as live", () => {
    assert.equal(
      isLiveStudySession({
        completed: false,
        endedAt: null,
        startedAt: new Date(now.getTime() - 20 * 60 * 1000),
        now,
      }),
      true
    );
  });

  it("ignores completed, ended, or stale sessions", () => {
    assert.equal(
      isLiveStudySession({
        completed: true,
        endedAt: null,
        startedAt: new Date(now.getTime() - 10 * 60 * 1000),
        now,
      }),
      false
    );
    assert.equal(
      isLiveStudySession({
        completed: false,
        endedAt: now,
        startedAt: new Date(now.getTime() - 10 * 60 * 1000),
        now,
      }),
      false
    );
    assert.equal(
      isLiveStudySession({
        completed: false,
        endedAt: null,
        startedAt: new Date(now.getTime() - LIVE_SESSION_MAX_MS - 1000),
        now,
      }),
      false
    );
  });
});

describe("status resolution", () => {
  it("lets a live session overlay a pinned status when auto is on", () => {
    const resolved = resolveStudentStatus({
      autoEnabled: true,
      manualStatus: "Exam mode",
      hasLiveSession: true,
      hasCurrentClass: true,
      examWithinDays: 2,
      assignmentDueWithinDays: 1,
    });
    assert.equal(resolved.status, "In session");
    assert.equal(resolved.source, "session");
    assert.equal(resolved.presence, "session");
    assert.equal(resolved.live, true);
  });

  it("uses in-class when studying is not live", () => {
    const resolved = resolveStudentStatus({
      autoEnabled: true,
      manualStatus: "Focused",
      hasLiveSession: false,
      hasCurrentClass: true,
      examWithinDays: 1,
      assignmentDueWithinDays: 0,
    });
    assert.equal(resolved.status, "In class");
    assert.equal(resolved.source, "class");
    assert.equal(resolved.presence, "class");
  });

  it("keeps a pinned status when there is no live activity", () => {
    const resolved = resolveStudentStatus({
      autoEnabled: true,
      manualStatus: "Taking a break",
      hasLiveSession: false,
      hasCurrentClass: false,
      examWithinDays: 2,
      assignmentDueWithinDays: 1,
    });
    assert.equal(resolved.status, "Taking a break");
    assert.equal(resolved.source, "manual");
    assert.equal(resolved.presence, "break");
    assert.equal(resolved.live, false);
  });

  it("derives exam and deadline only when nothing is pinned", () => {
    assert.equal(
      resolveStudentStatus({
        autoEnabled: true,
        manualStatus: null,
        hasLiveSession: false,
        hasCurrentClass: false,
        examWithinDays: 3,
        assignmentDueWithinDays: 0,
      }).status,
      "Exam mode"
    );
    assert.equal(
      resolveStudentStatus({
        autoEnabled: true,
        manualStatus: null,
        hasLiveSession: false,
        hasCurrentClass: false,
        examWithinDays: null,
        assignmentDueWithinDays: 1,
      }).status,
      "Deadline week"
    );
  });

  it("ignores context when automatic status is off", () => {
    const resolved = resolveStudentStatus({
      autoEnabled: false,
      manualStatus: "Focused",
      hasLiveSession: true,
      hasCurrentClass: true,
      examWithinDays: 0,
      assignmentDueWithinDays: 0,
    });
    assert.equal(resolved.status, "Focused");
    assert.equal(resolved.source, "manual");
    assert.equal(resolved.presence, "focus");
  });

  it("maps legacy stored labels", () => {
    const resolved = resolveStudentStatus({
      autoEnabled: false,
      manualStatus: "Locking In",
      hasLiveSession: false,
      hasCurrentClass: false,
      examWithinDays: null,
      assignmentDueWithinDays: null,
    });
    assert.equal(resolved.status, "Focused");
  });
});

describe("privacy", () => {
  it("public payload only has coarse status and presence", () => {
    const resolved = resolveStudentStatus({
      autoEnabled: true,
      manualStatus: null,
      hasLiveSession: true,
      hasCurrentClass: false,
      examWithinDays: 1,
      assignmentDueWithinDays: 0,
    });
    assert.deepEqual(publicIdentityStatus(resolved), {
      status: "In session",
      presence: "session",
      source: "session",
      live: true,
    });
    assert.equal("title" in publicIdentityStatus(resolved), false);
    assert.equal("subject" in publicIdentityStatus(resolved), false);
  });

  it("flags status text that looks like private data", () => {
    assert.equal(statusLooksPrivate("In session"), false);
    assert.equal(statusLooksPrivate("Exam mode"), false);
    assert.equal(statusLooksPrivate("GPA 9.1"), true);
    assert.equal(statusLooksPrivate("student@college.edu"), true);
    assert.equal(statusLooksPrivate("₹500 left"), true);
  });

  it("maps Campus Circle study flags without changing Circle payloads", () => {
    assert.equal(presenceFromCampusStudyStatus("IN_SESSION"), "session");
    assert.equal(presenceFromCampusStudyStatus("FOCUSING"), "focus");
    assert.equal(presenceFromCampusStudyStatus("BREAK"), "break");
    assert.equal(presenceFromCampusStudyStatus(null), "idle");
  });
});

describe("pinned status validation", () => {
  it("rejects derived in-class as a saved pin", () => {
    assert.equal(isValidAvatarStatus("In class"), true);
    assert.equal(isValidAvatarStatus("In session"), true);
    assert.equal(isValidAvatarStatus("Focused"), true);
    assert.equal(isValidAvatarStatus("Grinding"), true);
    assert.equal(isValidAvatarStatus("Available"), true);
  });
});
