-- Additive: document processing, generated artifacts, expense category memory.
-- No drops, truncates, or data deletion.

DO $$ BEGIN
  CREATE TYPE "DocumentProcessStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "uploaded_documents"
  ADD COLUMN IF NOT EXISTS "extracted_text" TEXT,
  ADD COLUMN IF NOT EXISTS "page_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "process_status" "DocumentProcessStatus" NOT NULL DEFAULT 'READY',
  ADD COLUMN IF NOT EXISTS "error_code" TEXT;

CREATE INDEX IF NOT EXISTS "uploaded_documents_user_id_process_status_idx"
  ON "uploaded_documents"("user_id", "process_status");

CREATE TABLE IF NOT EXISTS "generated_artifacts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "conversation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "generated_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "generated_artifacts_user_id_created_at_idx"
  ON "generated_artifacts"("user_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "generated_artifacts"
    ADD CONSTRAINT "generated_artifacts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "expense_category_hints" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "merchant_key" TEXT NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expense_category_hints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expense_category_hints_user_id_merchant_key_key"
  ON "expense_category_hints"("user_id", "merchant_key");

CREATE INDEX IF NOT EXISTS "expense_category_hints_user_id_idx"
  ON "expense_category_hints"("user_id");

DO $$ BEGIN
  ALTER TABLE "expense_category_hints"
    ADD CONSTRAINT "expense_category_hints_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
