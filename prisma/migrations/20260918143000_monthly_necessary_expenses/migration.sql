-- Additive only. No drops, truncates, or data deletion.

ALTER TABLE "student_profiles"
ADD COLUMN IF NOT EXISTS "monthly_necessary_expenses" DECIMAL(12, 2);
