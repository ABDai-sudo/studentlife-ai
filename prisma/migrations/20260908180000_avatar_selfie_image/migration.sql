-- Additive only. No drops, truncates, or data deletion.

ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "avatar_image_url" TEXT;
