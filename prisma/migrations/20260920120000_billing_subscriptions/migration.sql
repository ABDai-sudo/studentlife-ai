-- Additive billing + expense idempotency. No drops or data deletion.

ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'PRO_MONTHLY';
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'PRO_YEARLY';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'INCOMPLETE';

DO $$ BEGIN
  CREATE TYPE "BillingProviderName" AS ENUM ('NONE', 'DEV', 'STRIPE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingCheckoutStatus" AS ENUM ('OPEN', 'COMPLETE', 'EXPIRED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "provider" "BillingProviderName" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "provider_customer_id" TEXT,
  ADD COLUMN IF NOT EXISTS "provider_subscription_id" TEXT,
  ADD COLUMN IF NOT EXISTS "last_payment_error" TEXT,
  ADD COLUMN IF NOT EXISTS "last_provider_event_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_provider_event_id" TEXT;

CREATE INDEX IF NOT EXISTS "subscriptions_provider_subscription_id_idx"
  ON "subscriptions"("provider_subscription_id");

CREATE TABLE IF NOT EXISTS "billing_checkout_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "plan" "Plan" NOT NULL,
  "status" "BillingCheckoutStatus" NOT NULL DEFAULT 'OPEN',
  "provider" "BillingProviderName" NOT NULL,
  "provider_session_id" TEXT NOT NULL,
  "checkout_url" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_checkout_sessions_provider_session_id_key"
  ON "billing_checkout_sessions"("provider_session_id");
CREATE INDEX IF NOT EXISTS "billing_checkout_sessions_user_id_status_idx"
  ON "billing_checkout_sessions"("user_id", "status");

DO $$ BEGIN
  ALTER TABLE "billing_checkout_sessions"
    ADD CONSTRAINT "billing_checkout_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "billing_webhook_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "provider" "BillingProviderName" NOT NULL,
  "provider_event_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "event_created_at" TIMESTAMP(3) NOT NULL,
  "processed_at" TIMESTAMP(3),
  "skipped_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_webhook_events_provider_provider_event_id_key"
  ON "billing_webhook_events"("provider", "provider_event_id");
CREATE INDEX IF NOT EXISTS "billing_webhook_events_type_created_at_idx"
  ON "billing_webhook_events"("type", "created_at");

DO $$ BEGIN
  ALTER TABLE "billing_webhook_events"
    ADD CONSTRAINT "billing_webhook_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "client_request_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "expenses_user_id_client_request_id_key"
  ON "expenses"("user_id", "client_request_id");
