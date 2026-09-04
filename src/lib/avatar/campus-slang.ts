/**
 * Approved campus slang only. Never interpolate raw user text.
 * Selection is deterministic from `seed` — no Math.random.
 */

export const APPROVED_CAMPUS_SLANG = [
  "Time to find a local jugaad.",
  "Keep it chill — one task, then chai.",
  "No tension, just the next step.",
] as const;

export type ApprovedCampusSlang = (typeof APPROVED_CAMPUS_SLANG)[number];

/** FNV-1a 32-bit — stable across SSR and client. */
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickCampusSlang(seed: string): ApprovedCampusSlang | null {
  if (!seed) return null;
  const index = hashSeed(seed) % APPROVED_CAMPUS_SLANG.length;
  return APPROVED_CAMPUS_SLANG[index] ?? null;
}

export function isApprovedCampusSlang(value: string | null | undefined): boolean {
  if (!value) return false;
  return (APPROVED_CAMPUS_SLANG as readonly string[]).includes(value);
}
