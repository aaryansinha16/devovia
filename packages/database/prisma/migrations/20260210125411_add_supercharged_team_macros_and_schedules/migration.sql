-- AlterTable
ALTER TABLE "supercharged_macros" ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "supercharged_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "actionType" TEXT NOT NULL,
    "macroId" TEXT,
    "intent" TEXT,
    "slots" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunError" TEXT,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supercharged_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supercharged_schedules_userId_idx" ON "supercharged_schedules"("userId");

-- CreateIndex
CREATE INDEX "supercharged_schedules_isActive_nextRunAt_idx" ON "supercharged_schedules"("isActive", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "supercharged_schedules_userId_name_key" ON "supercharged_schedules"("userId", "name");

-- CreateIndex
CREATE INDEX "supercharged_macros_projectId_idx" ON "supercharged_macros"("projectId");

-- AddForeignKey
ALTER TABLE "supercharged_macros" ADD CONSTRAINT "supercharged_macros_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supercharged_schedules" ADD CONSTRAINT "supercharged_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
