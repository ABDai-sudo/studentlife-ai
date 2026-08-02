/** Wall-clock helpers for admin queries (intentionally non-deterministic). */
export function msAgo(ms: number): Date {
  return new Date(Date.now() - ms);
}

export function daysAgoDate(days: number): Date {
  return msAgo(days * 24 * 60 * 60 * 1000);
}
