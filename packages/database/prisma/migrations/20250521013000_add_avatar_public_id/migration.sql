-- Add avatarPublicId to User table
ALTER TABLE "User" ADD COLUMN "avatarPublicId" TEXT;

-- Add missing columns to Session table if they don't exist
-- (These appear to be in the database but not tracked in migrations)
DO $$ 
BEGIN
    -- Check if isActive column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Session' AND column_name='isActive') THEN
        ALTER TABLE "Session" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Check if updatedAt column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Session' AND column_name='updatedAt') THEN
        ALTER TABLE "Session" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
