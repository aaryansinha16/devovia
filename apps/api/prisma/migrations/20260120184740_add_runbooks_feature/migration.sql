/*
  Warnings:

  - You are about to drop the column `delta` on the `session_changes` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `session_changes` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `session_changes` table. All the data in the column will be lost.
  - Added the required column `changeType` to the `session_changes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `session_changes` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `session_changes` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RunbookStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RunbookEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('HTTP', 'SQL', 'SHELL', 'SCRIPT', 'MANUAL', 'CONDITIONAL', 'AI', 'WAIT', 'PARALLEL');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SecretType" AS ENUM ('API_KEY', 'DATABASE_URL', 'PASSWORD', 'TOKEN', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('SLACK', 'DISCORD', 'PAGERDUTY', 'WEBHOOK', 'EMAIL', 'JIRA', 'GITHUB');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('ONCE', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CRON');

-- AlterTable
ALTER TABLE "session_changes" DROP COLUMN "delta",
DROP COLUMN "metadata",
DROP COLUMN "type",
ADD COLUMN     "changeType" TEXT NOT NULL,
ADD COLUMN     "length" INTEGER,
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "userColor" TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE "runbooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "teamId" TEXT,
    "status" "RunbookStatus" NOT NULL DEFAULT 'DRAFT',
    "environment" "RunbookEnvironment" NOT NULL DEFAULT 'DEVELOPMENT',
    "tags" TEXT[],
    "steps" JSONB NOT NULL,
    "parameters" JSONB,
    "variables" JSONB,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 3600,
    "retryPolicy" JSONB,
    "rollbackSteps" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "collaborativeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "runbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_executions" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "triggeredBy" TEXT NOT NULL,
    "triggeredByName" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'manual',
    "inputParams" JSONB,
    "outputData" JSONB,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorStep" INTEGER,
    "environment" "RunbookEnvironment" NOT NULL,
    "executionContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runbook_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_step_results" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepName" TEXT,
    "stepType" "StepType" NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "runbook_step_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_logs" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepIndex" INTEGER,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runbook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_approvals" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepName" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredApprovers" TEXT[],
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "respondedAt" TIMESTAMP(3),
    "requestNote" TEXT,
    "responseNote" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "runbook_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_schedules" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "name" TEXT,
    "frequency" "ScheduleFrequency" NOT NULL,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "inputParams" JSONB,
    "environment" "RunbookEnvironment" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "runbook_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_secrets" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SecretType" NOT NULL DEFAULT 'OTHER',
    "encryptedValue" TEXT NOT NULL,
    "environment" "RunbookEnvironment",
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "runbook_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_permissions" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canExecute" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "runbook_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_webhooks" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "url" TEXT,
    "authConfig" JSONB,
    "triggerOn" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastTriggeredAt" TIMESTAMP(3),

    CONSTRAINT "runbook_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runbook_audit_logs" (
    "id" TEXT NOT NULL,
    "runbookId" TEXT,
    "executionId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runbook_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "runbooks_ownerId_idx" ON "runbooks"("ownerId");

-- CreateIndex
CREATE INDEX "runbooks_status_idx" ON "runbooks"("status");

-- CreateIndex
CREATE INDEX "runbooks_environment_idx" ON "runbooks"("environment");

-- CreateIndex
CREATE INDEX "runbook_executions_runbookId_idx" ON "runbook_executions"("runbookId");

-- CreateIndex
CREATE INDEX "runbook_executions_status_idx" ON "runbook_executions"("status");

-- CreateIndex
CREATE INDEX "runbook_executions_triggeredBy_idx" ON "runbook_executions"("triggeredBy");

-- CreateIndex
CREATE INDEX "runbook_executions_createdAt_idx" ON "runbook_executions"("createdAt");

-- CreateIndex
CREATE INDEX "runbook_step_results_executionId_idx" ON "runbook_step_results"("executionId");

-- CreateIndex
CREATE INDEX "runbook_step_results_stepIndex_idx" ON "runbook_step_results"("stepIndex");

-- CreateIndex
CREATE INDEX "runbook_logs_executionId_timestamp_idx" ON "runbook_logs"("executionId", "timestamp");

-- CreateIndex
CREATE INDEX "runbook_logs_level_idx" ON "runbook_logs"("level");

-- CreateIndex
CREATE INDEX "runbook_approvals_executionId_idx" ON "runbook_approvals"("executionId");

-- CreateIndex
CREATE INDEX "runbook_approvals_status_idx" ON "runbook_approvals"("status");

-- CreateIndex
CREATE INDEX "runbook_schedules_runbookId_idx" ON "runbook_schedules"("runbookId");

-- CreateIndex
CREATE INDEX "runbook_schedules_isActive_nextRunAt_idx" ON "runbook_schedules"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "runbook_secrets_runbookId_idx" ON "runbook_secrets"("runbookId");

-- CreateIndex
CREATE UNIQUE INDEX "runbook_secrets_runbookId_name_environment_key" ON "runbook_secrets"("runbookId", "name", "environment");

-- CreateIndex
CREATE INDEX "runbook_permissions_runbookId_idx" ON "runbook_permissions"("runbookId");

-- CreateIndex
CREATE UNIQUE INDEX "runbook_permissions_runbookId_userId_key" ON "runbook_permissions"("runbookId", "userId");

-- CreateIndex
CREATE INDEX "runbook_webhooks_runbookId_idx" ON "runbook_webhooks"("runbookId");

-- CreateIndex
CREATE INDEX "runbook_audit_logs_runbookId_idx" ON "runbook_audit_logs"("runbookId");

-- CreateIndex
CREATE INDEX "runbook_audit_logs_userId_idx" ON "runbook_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "runbook_audit_logs_timestamp_idx" ON "runbook_audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "runbooks" ADD CONSTRAINT "runbooks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_executions" ADD CONSTRAINT "runbook_executions_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_step_results" ADD CONSTRAINT "runbook_step_results_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "runbook_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_logs" ADD CONSTRAINT "runbook_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "runbook_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_approvals" ADD CONSTRAINT "runbook_approvals_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "runbook_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_schedules" ADD CONSTRAINT "runbook_schedules_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_secrets" ADD CONSTRAINT "runbook_secrets_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_permissions" ADD CONSTRAINT "runbook_permissions_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runbook_webhooks" ADD CONSTRAINT "runbook_webhooks_runbookId_fkey" FOREIGN KEY ("runbookId") REFERENCES "runbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
