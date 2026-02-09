-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'TEAM_ONLY');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SessionVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "SessionLanguage" AS ENUM ('TYPESCRIPT', 'JAVASCRIPT', 'PYTHON', 'SQL', 'JSON', 'MARKDOWN', 'HTML', 'CSS', 'YAML');

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

-- CreateEnum
CREATE TYPE "DeploymentPlatform" AS ENUM ('VERCEL', 'NETLIFY', 'RAILWAY', 'RENDER', 'FLY_IO', 'AWS_AMPLIFY', 'CLOUDFLARE_PAGES', 'GITHUB_PAGES', 'HEROKU', 'DIGITAL_OCEAN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'DEPLOYING', 'READY', 'ERROR', 'CANCELLED', 'ROLLBACK');

-- CreateEnum
CREATE TYPE "DeploymentEnvironment" AS ENUM ('PRODUCTION', 'PREVIEW', 'STAGING', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'PENDING', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "avatarPublicId" TEXT,
    "githubUrl" TEXT,
    "twitterUrl" TEXT,
    "portfolioUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "githubId" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repoUrl" TEXT,
    "demoUrl" TEXT,
    "thumbnail" TEXT,
    "thumbnailPublicId" TEXT,
    "techStack" TEXT[],
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Project Notes',
    "yjsState" BYTEA,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMessage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentSize" INTEGER,
    "attachmentType" TEXT,
    "attachmentPublicId" TEXT,

    CONSTRAINT "ProjectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snippet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Snippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "techStack" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "snippetId" TEXT,
    "postId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "snippetId" TEXT,
    "postId" TEXT,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborative_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibility" "SessionVisibility" NOT NULL DEFAULT 'PRIVATE',
    "language" "SessionLanguage" NOT NULL DEFAULT 'TYPESCRIPT',
    "content" TEXT,
    "lockedBy" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborative_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_permissions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SessionRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_snapshots" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT,
    "yjsState" BYTEA,
    "version" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "note" TEXT,
    "size" INTEGER,
    "isAutoSave" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "session_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_changes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userColor" TEXT,
    "changeType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "length" INTEGER,
    "content" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_changes_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "platform_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "DeploymentPlatform" NOT NULL,
    "platformName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "webhookSecret" TEXT,
    "platformUserId" TEXT,
    "platformUsername" TEXT,
    "platformTeamId" TEXT,
    "platformTeamName" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_sites" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "platformSiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "repoProvider" TEXT,
    "repoOwner" TEXT,
    "repoName" TEXT,
    "repoBranch" TEXT DEFAULT 'main',
    "repoUrl" TEXT,
    "productionUrl" TEXT,
    "previewUrl" TEXT,
    "customDomains" TEXT[],
    "framework" TEXT,
    "buildCommand" TEXT,
    "outputDir" TEXT,
    "installCommand" TEXT,
    "projectId" TEXT,
    "autoDeployEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDeploy" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastDeployAt" TIMESTAMP(3),

    CONSTRAINT "deployment_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "platformDeploymentId" TEXT NOT NULL,
    "platformBuildId" TEXT,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED',
    "environment" "DeploymentEnvironment" NOT NULL DEFAULT 'PREVIEW',
    "gitCommitSha" TEXT,
    "gitCommitMessage" TEXT,
    "gitBranch" TEXT,
    "gitAuthor" TEXT,
    "gitAuthorAvatar" TEXT,
    "deploymentUrl" TEXT,
    "inspectUrl" TEXT,
    "buildDuration" INTEGER,
    "buildLogs" TEXT,
    "riskScore" INTEGER,
    "riskFactors" JSONB,
    "aiSummary" TEXT,
    "aiSuggestions" JSONB,
    "isRollback" BOOLEAN NOT NULL DEFAULT false,
    "rollbackFromId" TEXT,
    "canRollback" BOOLEAN NOT NULL DEFAULT true,
    "sessionId" TEXT,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "triggeredBy" TEXT,
    "triggeredByName" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'push',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_events" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_logs" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "stackTrace" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "deployment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_runbooks" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "runbookId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "executionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_runbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_env_vars" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "environment" "DeploymentEnvironment",
    "syncedToPlatform" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_env_vars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "environment" "DeploymentEnvironment",
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifySlack" BOOLEAN NOT NULL DEFAULT false,
    "slackWebhook" TEXT,
    "notifyDiscord" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhook" TEXT,
    "onBuildStart" BOOLEAN NOT NULL DEFAULT false,
    "onBuildSuccess" BOOLEAN NOT NULL DEFAULT true,
    "onBuildFailure" BOOLEAN NOT NULL DEFAULT true,
    "onDeploySuccess" BOOLEAN NOT NULL DEFAULT true,
    "onDeployFailure" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PostTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TemplateTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_visibility_idx" ON "Project"("visibility");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectLink_projectId_idx" ON "ProjectLink"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectNote_projectId_key" ON "ProjectNote"("projectId");

-- CreateIndex
CREATE INDEX "ProjectNote_projectId_idx" ON "ProjectNote"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMessage_projectId_idx" ON "ProjectMessage"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMessage_userId_idx" ON "ProjectMessage"("userId");

-- CreateIndex
CREATE INDEX "ProjectMessage_createdAt_idx" ON "ProjectMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Snippet_userId_idx" ON "Snippet"("userId");

-- CreateIndex
CREATE INDEX "Snippet_language_idx" ON "Snippet"("language");

-- CreateIndex
CREATE INDEX "Snippet_isPublic_idx" ON "Snippet"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_projectId_snippetId_postId_key" ON "Like"("userId", "projectId", "snippetId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_sessions_inviteCode_key" ON "collaborative_sessions"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "session_permissions_sessionId_userId_key" ON "session_permissions"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "session_snapshots_sessionId_createdAt_idx" ON "session_snapshots"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "session_changes_sessionId_timestamp_idx" ON "session_changes"("sessionId", "timestamp");

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

-- CreateIndex
CREATE INDEX "platform_connections_userId_idx" ON "platform_connections"("userId");

-- CreateIndex
CREATE INDEX "platform_connections_platform_idx" ON "platform_connections"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "platform_connections_userId_platform_platformTeamId_key" ON "platform_connections"("userId", "platform", "platformTeamId");

-- CreateIndex
CREATE INDEX "deployment_sites_connectionId_idx" ON "deployment_sites"("connectionId");

-- CreateIndex
CREATE INDEX "deployment_sites_projectId_idx" ON "deployment_sites"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_sites_connectionId_platformSiteId_key" ON "deployment_sites"("connectionId", "platformSiteId");

-- CreateIndex
CREATE INDEX "deployments_siteId_idx" ON "deployments"("siteId");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- CreateIndex
CREATE INDEX "deployments_environment_idx" ON "deployments"("environment");

-- CreateIndex
CREATE INDEX "deployments_createdAt_idx" ON "deployments"("createdAt");

-- CreateIndex
CREATE INDEX "deployments_siteId_status_createdAt_idx" ON "deployments"("siteId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "deployments_status_environment_createdAt_idx" ON "deployments"("status", "environment", "createdAt");

-- CreateIndex
CREATE INDEX "deployments_triggeredBy_createdAt_idx" ON "deployments"("triggeredBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_siteId_platformDeploymentId_key" ON "deployments"("siteId", "platformDeploymentId");

-- CreateIndex
CREATE INDEX "deployment_events_deploymentId_timestamp_idx" ON "deployment_events"("deploymentId", "timestamp");

-- CreateIndex
CREATE INDEX "deployment_logs_deploymentId_timestamp_idx" ON "deployment_logs"("deploymentId", "timestamp");

-- CreateIndex
CREATE INDEX "deployment_logs_deploymentId_level_idx" ON "deployment_logs"("deploymentId", "level");

-- CreateIndex
CREATE INDEX "deployment_runbooks_deploymentId_idx" ON "deployment_runbooks"("deploymentId");

-- CreateIndex
CREATE INDEX "deployment_runbooks_runbookId_idx" ON "deployment_runbooks"("runbookId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_runbooks_deploymentId_runbookId_phase_key" ON "deployment_runbooks"("deploymentId", "runbookId", "phase");

-- CreateIndex
CREATE INDEX "deployment_env_vars_siteId_idx" ON "deployment_env_vars"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_env_vars_siteId_key_environment_key" ON "deployment_env_vars"("siteId", "key", "environment");

-- CreateIndex
CREATE INDEX "deployment_notifications_userId_idx" ON "deployment_notifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_notifications_userId_siteId_key" ON "deployment_notifications"("userId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectTags_AB_unique" ON "_ProjectTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectTags_B_index" ON "_ProjectTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PostTags_AB_unique" ON "_PostTags"("A", "B");

-- CreateIndex
CREATE INDEX "_PostTags_B_index" ON "_PostTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TemplateTags_AB_unique" ON "_TemplateTags"("A", "B");

-- CreateIndex
CREATE INDEX "_TemplateTags_B_index" ON "_TemplateTags"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLink" ADD CONSTRAINT "ProjectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "Snippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborative_sessions" ADD CONSTRAINT "collaborative_sessions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_permissions" ADD CONSTRAINT "session_permissions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_permissions" ADD CONSTRAINT "session_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_snapshots" ADD CONSTRAINT "session_snapshots_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_changes" ADD CONSTRAINT "session_changes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "deployment_sites" ADD CONSTRAINT "deployment_sites_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "platform_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_sites" ADD CONSTRAINT "deployment_sites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "deployment_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_events" ADD CONSTRAINT "deployment_events_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_logs" ADD CONSTRAINT "deployment_logs_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_runbooks" ADD CONSTRAINT "deployment_runbooks_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectTags" ADD CONSTRAINT "_ProjectTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectTags" ADD CONSTRAINT "_ProjectTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTags" ADD CONSTRAINT "_PostTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTags" ADD CONSTRAINT "_PostTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateTags" ADD CONSTRAINT "_TemplateTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TemplateTags" ADD CONSTRAINT "_TemplateTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

