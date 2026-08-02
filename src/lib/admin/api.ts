import { AuthorizationError, requireOwner } from "@/lib/auth";
import { fail, forbidden, unauthorized, serverError } from "@/lib/api";
import { safeLog } from "@/lib/security/safe-log";

export async function withOwnerApi(
  handler: (owner: Awaited<ReturnType<typeof requireOwner>>) => Promise<Response>
): Promise<Response> {
  try {
    const owner = await requireOwner();
    return await handler(owner);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.status === 401) return unauthorized();
      return forbidden();
    }
    safeLog("error", "Admin API error", { error: String(error) });
    return serverError();
  }
}

export function tooManyRequests(retryAfterSec: number): Response {
  return fail(
    "Too many requests. Try again later.",
    { code: "RATE_LIMITED", status: 429 },
    { headers: { "Retry-After": String(retryAfterSec) } }
  );
}
