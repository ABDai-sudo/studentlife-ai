-- Additive Campus Circle collaboration tables. Safe for Neon — no drops, no truncates.

DO $$ BEGIN
  CREATE TYPE "CampusConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampusInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampusStudyStatus" AS ENUM ('AVAILABLE', 'FOCUSING', 'IN_SESSION', 'BREAK', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampusReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampusReactionKind" AS ENUM ('ENCOURAGE', 'THANKS', 'FOCUS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampusGroupRole" AS ENUM ('OWNER', 'MEMBER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampusActivityKind" AS ENUM ('CHECK_IN', 'PLAN', 'NOTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_circle_settings" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "study_status" "CampusStudyStatus" NOT NULL DEFAULT 'HIDDEN',
  "share_study_status" BOOLEAN NOT NULL DEFAULT false,
  "allow_connection_requests" BOOLEAN NOT NULL DEFAULT true,
  "allow_study_invites" BOOLEAN NOT NULL DEFAULT true,
  "allow_quiz_challenges" BOOLEAN NOT NULL DEFAULT true,
  "allow_group_invites" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_circle_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_circle_settings_user_id_key"
  ON "campus_circle_settings"("user_id");

DO $$ BEGIN
  ALTER TABLE "campus_circle_settings"
    ADD CONSTRAINT "campus_circle_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_connections" (
  "id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "addressee_id" TEXT NOT NULL,
  "status" "CampusConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(3),
  CONSTRAINT "campus_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_connections_requester_id_addressee_id_key"
  ON "campus_connections"("requester_id", "addressee_id");
CREATE INDEX IF NOT EXISTS "campus_connections_addressee_id_status_idx"
  ON "campus_connections"("addressee_id", "status");
CREATE INDEX IF NOT EXISTS "campus_connections_requester_id_status_idx"
  ON "campus_connections"("requester_id", "status");

DO $$ BEGIN
  ALTER TABLE "campus_connections"
    ADD CONSTRAINT "campus_connections_requester_id_fkey"
    FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_connections"
    ADD CONSTRAINT "campus_connections_addressee_id_fkey"
    FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_blocks" (
  "id" TEXT NOT NULL,
  "blocker_id" TEXT NOT NULL,
  "blocked_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_blocks_blocker_id_blocked_id_key"
  ON "campus_blocks"("blocker_id", "blocked_id");
CREATE INDEX IF NOT EXISTS "campus_blocks_blocked_id_idx"
  ON "campus_blocks"("blocked_id");

DO $$ BEGIN
  ALTER TABLE "campus_blocks"
    ADD CONSTRAINT "campus_blocks_blocker_id_fkey"
    FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_blocks"
    ADD CONSTRAINT "campus_blocks_blocked_id_fkey"
    FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_reports" (
  "id" TEXT NOT NULL,
  "reporter_id" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" "CampusReportStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_reports_reporter_id_target_type_target_id_key"
  ON "campus_reports"("reporter_id", "target_type", "target_id");
CREATE INDEX IF NOT EXISTS "campus_reports_status_created_at_idx"
  ON "campus_reports"("status", "created_at");

DO $$ BEGIN
  ALTER TABLE "campus_reports"
    ADD CONSTRAINT "campus_reports_reporter_id_fkey"
    FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_study_invites" (
  "id" TEXT NOT NULL,
  "from_user_id" TEXT NOT NULL,
  "to_user_id" TEXT NOT NULL,
  "status" "CampusInviteStatus" NOT NULL DEFAULT 'PENDING',
  "topic" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(3),
  CONSTRAINT "campus_study_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_study_invites_from_user_id_to_user_id_key"
  ON "campus_study_invites"("from_user_id", "to_user_id");
CREATE INDEX IF NOT EXISTS "campus_study_invites_to_user_id_status_idx"
  ON "campus_study_invites"("to_user_id", "status");

DO $$ BEGIN
  ALTER TABLE "campus_study_invites"
    ADD CONSTRAINT "campus_study_invites_from_user_id_fkey"
    FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_study_invites"
    ADD CONSTRAINT "campus_study_invites_to_user_id_fkey"
    FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_quiz_challenges" (
  "id" TEXT NOT NULL,
  "from_user_id" TEXT NOT NULL,
  "to_user_id" TEXT NOT NULL,
  "status" "CampusInviteStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(3),
  CONSTRAINT "campus_quiz_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_quiz_challenges_from_user_id_to_user_id_key"
  ON "campus_quiz_challenges"("from_user_id", "to_user_id");
CREATE INDEX IF NOT EXISTS "campus_quiz_challenges_to_user_id_status_idx"
  ON "campus_quiz_challenges"("to_user_id", "status");

DO $$ BEGIN
  ALTER TABLE "campus_quiz_challenges"
    ADD CONSTRAINT "campus_quiz_challenges_from_user_id_fkey"
    FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_quiz_challenges"
    ADD CONSTRAINT "campus_quiz_challenges_to_user_id_fkey"
    FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_recap_shares" (
  "id" TEXT NOT NULL,
  "recap_id" TEXT NOT NULL,
  "from_user_id" TEXT NOT NULL,
  "to_user_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_recap_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_recap_shares_recap_id_to_user_id_key"
  ON "campus_recap_shares"("recap_id", "to_user_id");
CREATE INDEX IF NOT EXISTS "campus_recap_shares_to_user_id_created_at_idx"
  ON "campus_recap_shares"("to_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "campus_recap_shares_from_user_id_created_at_idx"
  ON "campus_recap_shares"("from_user_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "campus_recap_shares"
    ADD CONSTRAINT "campus_recap_shares_recap_id_fkey"
    FOREIGN KEY ("recap_id") REFERENCES "weekly_recaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_recap_shares"
    ADD CONSTRAINT "campus_recap_shares_from_user_id_fkey"
    FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_recap_shares"
    ADD CONSTRAINT "campus_recap_shares_to_user_id_fkey"
    FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_study_groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "invite_code" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_study_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_study_groups_invite_code_key"
  ON "campus_study_groups"("invite_code");
CREATE INDEX IF NOT EXISTS "campus_study_groups_owner_id_idx"
  ON "campus_study_groups"("owner_id");

DO $$ BEGIN
  ALTER TABLE "campus_study_groups"
    ADD CONSTRAINT "campus_study_groups_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_study_group_members" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "CampusGroupRole" NOT NULL DEFAULT 'MEMBER',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_study_group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_study_group_members_group_id_user_id_key"
  ON "campus_study_group_members"("group_id", "user_id");
CREATE INDEX IF NOT EXISTS "campus_study_group_members_user_id_idx"
  ON "campus_study_group_members"("user_id");

DO $$ BEGIN
  ALTER TABLE "campus_study_group_members"
    ADD CONSTRAINT "campus_study_group_members_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "campus_study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_study_group_members"
    ADD CONSTRAINT "campus_study_group_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_study_group_invites" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "invited_user_id" TEXT NOT NULL,
  "invited_by_id" TEXT NOT NULL,
  "status" "CampusInviteStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(3),
  CONSTRAINT "campus_study_group_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_study_group_invites_group_id_invited_user_id_key"
  ON "campus_study_group_invites"("group_id", "invited_user_id");
CREATE INDEX IF NOT EXISTS "campus_study_group_invites_invited_user_id_status_idx"
  ON "campus_study_group_invites"("invited_user_id", "status");

DO $$ BEGIN
  ALTER TABLE "campus_study_group_invites"
    ADD CONSTRAINT "campus_study_group_invites_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "campus_study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_study_group_invites"
    ADD CONSTRAINT "campus_study_group_invites_invited_user_id_fkey"
    FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_study_group_invites"
    ADD CONSTRAINT "campus_study_group_invites_invited_by_id_fkey"
    FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_study_group_activities" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "kind" "CampusActivityKind" NOT NULL DEFAULT 'CHECK_IN',
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_study_group_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "campus_study_group_activities_group_id_created_at_idx"
  ON "campus_study_group_activities"("group_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "campus_study_group_activities"
    ADD CONSTRAINT "campus_study_group_activities_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "campus_study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campus_study_group_activities"
    ADD CONSTRAINT "campus_study_group_activities_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "campus_reactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "kind" "CampusReactionKind" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campus_reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campus_reactions_user_id_target_type_target_id_kind_key"
  ON "campus_reactions"("user_id", "target_type", "target_id", "kind");
CREATE INDEX IF NOT EXISTS "campus_reactions_target_type_target_id_idx"
  ON "campus_reactions"("target_type", "target_id");

DO $$ BEGIN
  ALTER TABLE "campus_reactions"
    ADD CONSTRAINT "campus_reactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
