-- Additive: Campus Circle moderation fields, campus notification category,
-- campus social preference, and Postgres-backed rate-limit buckets.
-- Safe for Neon — no drops, no truncates.

ALTER TABLE "campus_reports" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3);
ALTER TABLE "campus_reports" ADD COLUMN IF NOT EXISTS "reviewed_by_id" TEXT;
ALTER TABLE "campus_reports" ADD COLUMN IF NOT EXISTS "resolution_note" TEXT;

CREATE INDEX IF NOT EXISTS "campus_reports_reviewed_by_id_idx"
  ON "campus_reports"("reviewed_by_id");

DO $$ BEGIN
  ALTER TABLE "campus_reports"
    ADD CONSTRAINT "campus_reports_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationCategory" ADD VALUE 'CAMPUS_CIRCLE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "notification_preferences"
  ADD COLUMN IF NOT EXISTS "campus_social" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "reset_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx"
  ON "rate_limit_buckets"("reset_at");
