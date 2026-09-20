import { createHmac, timingSafeEqual } from "crypto";

export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSec = 300
): { ok: true; timestamp: number } | { ok: false; reason: string } {
  if (!header) return { ok: false, reason: "missing_signature" };
  const parts = Object.fromEntries(
    header.split(",").map((item) => {
      const [k, ...rest] = item.trim().split("=");
      return [k, rest.join("=")];
    })
  );
  const timestamp = Number(parts.t);
  const signatures = [parts.v1, parts.v0].filter(Boolean);
  if (!Number.isFinite(timestamp) || signatures.length === 0) {
    return { ok: false, reason: "malformed_signature" };
  }
  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > toleranceSec) return { ok: false, reason: "timestamp_expired" };

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const match = signatures.some((sig) => {
    const got = Buffer.from(sig, "utf8");
    return got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf);
  });
  return match ? { ok: true, timestamp } : { ok: false, reason: "bad_signature" };
}

export function verifyDevWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string
): boolean {
  if (!header || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const got = header.replace(/^sha256=/i, "").trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(got, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
