-- AlterTable
ALTER TABLE "ProjectMessage" ADD COLUMN     "replyToContent" TEXT,
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "replyToUserId" TEXT,
ADD COLUMN     "replyToUserName" TEXT;
