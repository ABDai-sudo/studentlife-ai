/** Hard cap. Includes the first request. Never loops beyond this. */
export const GEMINI_MAX_ATTEMPTS = 3;

export function isRetryableGeminiStatus(status: number): boolean {
  return status === 429 || status === 503;
}

/**
 * Delay before the next attempt. attemptIndex 0 is the first retry.
 * Honors a short Retry-After. Ignores huge or unparsable values.
 */
export function geminiBackoffMs(
  attemptIndex: number,
  retryAfterHeader: string | null,
  jitterMs = 0
): number {
  const rawBase = Number(process.env.GEMINI_RETRY_BASE_MS || "400");
  const base =
    Number.isFinite(rawBase) && rawBase >= 0 && rawBase <= 2_000 ? rawBase : 400;
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 2) {
      return Math.round(seconds * 1000);
    }
  }
  const exp = Math.min(2_000, Math.round(base * 2 ** Math.max(0, attemptIndex)));
  const jitter = Number.isFinite(jitterMs) ? Math.max(0, Math.min(250, jitterMs)) : 0;
  return Math.min(2_000, exp + Math.round(jitter));
}
