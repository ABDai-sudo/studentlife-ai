-- Additive: PAST_DUE grace, UNPAID status, recurring expenses.
-- No drops, truncates, or data deletion.

ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'UNPAID';

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "grace_until" TIMESTAMP(3);

DO $$ BEGIN
  CREATE TYPE "RecurringExpenseMode" AS ENUM ('NECESSITY', 'EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "recurring_expenses" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'INR',
  "category" "ExpenseCategory" NOT NULL,
  "description" TEXT,
  "day_of_month" INTEGER NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "mode" "RecurringExpenseMode" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recurring_expenses_user_id_active_idx"
  ON "recurring_expenses"("user_id", "active");

DO $$ BEGIN
  ALTER TABLE "recurring_expenses"
    ADD CONSTRAINT "recurring_expenses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "recurring_expense_id" TEXT,
  ADD COLUMN IF NOT EXISTS "counts_toward_spend" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "expenses_user_id_counts_toward_spend_idx"
  ON "expenses"("user_id", "counts_toward_spend");

DO $$ BEGIN
  ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_recurring_expense_id_fkey"
    FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "recurring_expense_occurrences" (
  "id" TEXT NOT NULL,
  "recurring_expense_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "period_key" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "expense_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recurring_expense_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recurring_expense_occurrences_recurring_expense_id_period_key_key"
  ON "recurring_expense_occurrences"("recurring_expense_id", "period_key");
CREATE UNIQUE INDEX IF NOT EXISTS "recurring_expense_occurrences_expense_id_key"
  ON "recurring_expense_occurrences"("expense_id");
CREATE INDEX IF NOT EXISTS "recurring_expense_occurrences_user_id_period_key_idx"
  ON "recurring_expense_occurrences"("user_id", "period_key");

DO $$ BEGIN
  ALTER TABLE "recurring_expense_occurrences"
    ADD CONSTRAINT "recurring_expense_occurrences_recurring_expense_id_fkey"
    FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "recurring_expense_occurrences"
    ADD CONSTRAINT "recurring_expense_occurrences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "recurring_expense_occurrences"
    ADD CONSTRAINT "recurring_expense_occurrences_expense_id_fkey"
    FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
