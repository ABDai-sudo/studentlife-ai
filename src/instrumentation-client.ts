/**
 * Client-only analytics bootstrap (runs once before React hydration).
 * Next.js instrumentation-client convention - initializes before React hydrates.
 *
 * Does not call Clarity.identify / setTag with user PII.
 * Clarity masks password inputs by default; we do not opt into capturing secrets.
 */
import Clarity from "@microsoft/clarity";

const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

if (process.env.NODE_ENV === "production" && projectId) {
  try {
    Clarity.init(projectId);
  } catch {
    // Analytics must never break the app.
  }
}
