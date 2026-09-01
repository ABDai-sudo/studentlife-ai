/**
 * Display-only XP progress for identity UI.
 * Thresholds must stay in sync with LEVELS in src/services/gamification.service.ts.
 * Do not use this to award XP or persist level.
 */

const THRESHOLDS = [
  { level: 1, xp: 0, name: "Getting started" },
  { level: 2, xp: 100, name: "Focused learner" },
  { level: 3, xp: 300, name: "On schedule" },
  { level: 4, xp: 600, name: "Consistent" },
  { level: 5, xp: 1000, name: "Strong semester" },
  { level: 6, xp: 1500, name: "Exam ready" },
  { level: 7, xp: 2500, name: "Top of class" },
] as const;

export function xpProgressFromTotal(xpTotal: number) {
  const safe = Math.max(0, xpTotal);
  let current: (typeof THRESHOLDS)[number] = THRESHOLDS[0];
  for (const row of THRESHOLDS) {
    if (safe >= row.xp) current = row;
  }
  const next = THRESHOLDS.find((row) => row.level === current.level + 1);
  const nextAt = next?.xp ?? current.xp;
  const prevAt = current.xp;
  const span = Math.max(1, nextAt - prevAt);
  return {
    levelName: current.name,
    levelProgress: next
      ? Math.min(100, Math.round(((safe - prevAt) / span) * 100))
      : 100,
    xpToNext: next ? Math.max(0, nextAt - safe) : 0,
  };
}
