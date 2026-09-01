import { prisma } from "@/lib/db";

/**
 * Ensures notification tables/enums exist on Neon.
 * Matches prisma/migrations/20260811153000_notification_tables — additive only.
 * Safe to call repeatedly (IF NOT EXISTS / duplicate_object guards).
 */
let ensurePromise: Promise<void> | null = null;

const STATEMENTS = [
  `DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'BROWSER', 'WEB_PUSH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  `DO $$ BEGIN
  CREATE TYPE "NotificationCategory" AS ENUM (
    'STREAK_AT_RISK',
    'DAILY_QUESTS',
    'ASSIGNMENT_DEADLINE',
    'UPCOMING_EXAM',
    'FOCUS_REMINDER',
    'ACHIEVEMENT',
    'WEEKLY_RECAP',
    'LOW_MONEY',
    'OVERSPENDING',
    'SAVINGS_GOAL',
    'UPCOMING_EXPENSE',
    'SAFE_SPEND_UPDATE',
    'PRODUCT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  `CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "pause_all" BOOLEAN NOT NULL DEFAULT false,
  "quiet_hours_start" TEXT,
  "quiet_hours_end" TEXT,
  "preferred_reminder_time" TEXT NOT NULL DEFAULT '19:00',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "use_personality_wording" BOOLEAN NOT NULL DEFAULT true,
  "streak_at_risk" BOOLEAN NOT NULL DEFAULT true,
  "streak_final_reminder" BOOLEAN NOT NULL DEFAULT false,
  "daily_quests" BOOLEAN NOT NULL DEFAULT true,
  "assignment_deadline" BOOLEAN NOT NULL DEFAULT true,
  "upcoming_exam" BOOLEAN NOT NULL DEFAULT true,
  "focus_reminder" BOOLEAN NOT NULL DEFAULT true,
  "achievement" BOOLEAN NOT NULL DEFAULT true,
  "weekly_recap" BOOLEAN NOT NULL DEFAULT true,
  "low_money" BOOLEAN NOT NULL DEFAULT true,
  "overspending" BOOLEAN NOT NULL DEFAULT true,
  "savings_goal" BOOLEAN NOT NULL DEFAULT true,
  "upcoming_expense" BOOLEAN NOT NULL DEFAULT true,
  "safe_spend_update" BOOLEAN NOT NULL DEFAULT false,
  "category_warn_percent" INTEGER NOT NULL DEFAULT 70,
  "category_high_percent" INTEGER NOT NULL DEFAULT 90,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_id_key"
  ON "notification_preferences"("user_id");`,
  `DO $$ BEGIN
  ALTER TABLE "notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  `CREATE TABLE IF NOT EXISTS "user_notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "read_at" TIMESTAMP(3),
  "snoozed_until" TIMESTAMP(3),
  "idempotency_key" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_notifications_user_id_idempotency_key_key"
  ON "user_notifications"("user_id", "idempotency_key");`,
  `CREATE INDEX IF NOT EXISTS "user_notifications_user_id_created_at_idx"
  ON "user_notifications"("user_id", "created_at");`,
  `CREATE INDEX IF NOT EXISTS "user_notifications_user_id_read_at_idx"
  ON "user_notifications"("user_id", "read_at");`,
  `DO $$ BEGIN
  ALTER TABLE "user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  `CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_user_id_endpoint_key"
  ON "push_subscriptions"("user_id", "endpoint");`,
  `CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx"
  ON "push_subscriptions"("user_id");`,
  `DO $$ BEGIN
  ALTER TABLE "push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  `CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "notification_id" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "error_safe" TEXT,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_user_id_channel_idempotency_key_key"
  ON "notification_deliveries"("user_id", "channel", "idempotency_key");`,
  `CREATE INDEX IF NOT EXISTS "notification_deliveries_user_id_created_at_idx"
  ON "notification_deliveries"("user_id", "created_at");`,
  `DO $$ BEGIN
  ALTER TABLE "notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  `DO $$ BEGIN
  ALTER TABLE "notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_notification_id_fkey"
    FOREIGN KEY ("notification_id") REFERENCES "user_notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
];

export function ensureNotificationSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      for (const sql of STATEMENTS) {
        await prisma.$executeRawUnsafe(sql);
      }
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

function isMissingRelationError(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  return (
    code === "P2021" ||
    code === "42P01" ||
    /does not exist|relation .*notification/i.test(message)
  );
}

/** Run op; if notification tables are missing, create them once and retry. */
export async function withNotificationSchema<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    await ensureNotificationSchema();
    return operation();
  }
}
