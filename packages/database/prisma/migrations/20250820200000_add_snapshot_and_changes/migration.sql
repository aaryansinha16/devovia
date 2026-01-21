-- AlterTable: Add missing columns to session_snapshots
ALTER TABLE "session_snapshots" ADD COLUMN IF NOT EXISTS "version" SERIAL;
ALTER TABLE "session_snapshots" ADD COLUMN IF NOT EXISTS "createdByName" TEXT;
ALTER TABLE "session_snapshots" ADD COLUMN IF NOT EXISTS "isAutoSave" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_snapshots_sessionId_createdAt_idx" ON "session_snapshots"("sessionId", "createdAt");

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "session_changes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "type" TEXT NOT NULL,
    "delta" JSONB,
    "content" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "session_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_changes_sessionId_timestamp_idx" ON "session_changes"("sessionId", "timestamp");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'session_changes_sessionId_fkey'
    ) THEN
        ALTER TABLE "session_changes" ADD CONSTRAINT "session_changes_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
