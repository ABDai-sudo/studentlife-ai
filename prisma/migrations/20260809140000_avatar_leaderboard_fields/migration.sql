-- Additive only. No drops, truncates, or data deletion.

ALTER TABLE "student_profiles" ADD COLUMN "avatar_preset_id" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "avatar_status" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "leaderboard_show_avatar" BOOLEAN NOT NULL DEFAULT true;
