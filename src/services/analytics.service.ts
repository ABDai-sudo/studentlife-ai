import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripSensitiveQuery } from "@/lib/security/hash";
import { safeLog } from "@/lib/security/safe-log";

export const ALLOWED_ANALYTICS_EVENTS = [
  "page_view",
  "landing_page_view",
  "signup_started",
  "signup_completed",
  "login_success",
  "login_failure",
  "logout",
  "dashboard_opened",
  "ai_tutor_opened",
  "ai_prompt_submitted",
  "subject_created",
  "note_created",
  "assignment_created",
  "assignment_completed",
  "timetable_opened",
  "exam_created",
  "study_plan_created",
  "expense_module_opened",
  "profile_updated",
  "admin_dashboard_opened",
] as const;

const metadataSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .refine((obj) => JSON.stringify(obj).length <= 1024, {
    message: "Metadata too large",
  });

export const analyticsEventSchema = z.object({
  eventName: z.enum(ALLOWED_ANALYTICS_EVENTS),
  path: z.string().max(500).optional(),
  referrerDomain: z.string().max(200).optional(),
  deviceCategory: z.string().max(40).optional(),
  browserCategory: z.string().max(40).optional(),
  anonymousId: z.string().max(128).optional(),
  sessionKey: z.string().max(128).optional(),
  metadata: metadataSchema.optional(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;

export async function trackAnalyticsEvent(
  input: AnalyticsEventInput,
  userId?: string | null
): Promise<void> {
  try {
    const path = input.path ? stripSensitiveQuery(input.path) : null;
    await prisma.analyticsEvent.create({
      data: {
        eventName: input.eventName,
        userId: userId ?? null,
        anonymousId: input.anonymousId ?? null,
        sessionKey: input.sessionKey ?? null,
        path,
        referrerDomain: input.referrerDomain ?? null,
        deviceCategory: input.deviceCategory ?? null,
        browserCategory: input.browserCategory ?? null,
        metadata: input.metadata ?? undefined,
      },
    });

    if (input.sessionKey) {
      await prisma.analyticsSession.upsert({
        where: { sessionKey: input.sessionKey },
        create: {
          sessionKey: input.sessionKey,
          userId: userId ?? null,
          anonymousId: input.anonymousId ?? null,
          deviceCategory: input.deviceCategory ?? null,
          browserCategory: input.browserCategory ?? null,
        },
        update: {
          lastSeenAt: new Date(),
          pageCount: { increment: input.eventName === "page_view" ? 1 : 0 },
          ...(userId ? { userId } : {}),
        },
      });
    }
  } catch (error) {
    safeLog("warn", "Analytics ingestion failed", { error: String(error) });
  }
}
