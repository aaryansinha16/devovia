-- Add only the missing columns with default values to handle existing data
-- AlterTable
ALTER TABLE "Session" 
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
