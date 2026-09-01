-- Additive Study Buddy plans. Safe for Neon — no drops, no truncates.

DO $$ BEGIN
  CREATE TYPE "StudyBuddyItemKind" AS ENUM (
    'STUDY_NOW',
    'DEADLINE',
    'EXAM',
    'WEAK_TOPIC',
    'REVISION',
    'TIMETABLE',
    'CONTINUE_SESSION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "study_buddy_plans" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "plan_date" DATE NOT NULL,
  "headline" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "facts_json" JSONB NOT NULL,
  "conversation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "study_buddy_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "study_buddy_plans_user_id_plan_date_key"
  ON "study_buddy_plans"("user_id", "plan_date");

CREATE INDEX IF NOT EXISTS "study_buddy_plans_user_id_created_at_idx"
  ON "study_buddy_plans"("user_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "study_buddy_plans"
    ADD CONSTRAINT "study_buddy_plans_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "study_buddy_plan_items" (
  "id" TEXT NOT NULL,
  "plan_id" TEXT NOT NULL,
  "kind" "StudyBuddyItemKind" NOT NULL,
  "title" TEXT NOT NULL,
  "subject" TEXT,
  "source_type" TEXT,
  "source_id" TEXT,
  "minutes" INTEGER NOT NULL DEFAULT 25,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "from_database" BOOLEAN NOT NULL DEFAULT true,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "study_buddy_plan_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "study_buddy_plan_items_plan_id_sort_order_idx"
  ON "study_buddy_plan_items"("plan_id", "sort_order");

DO $$ BEGIN
  ALTER TABLE "study_buddy_plan_items"
    ADD CONSTRAINT "study_buddy_plan_items_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "study_buddy_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
