-- Ensure enums exist
DO $$ BEGIN
  CREATE TYPE "DeploymentPlatform" AS ENUM ('VERCEL', 'NETLIFY', 'RAILWAY', 'RENDER', 'FLY_IO', 'AWS_AMPLIFY', 'CLOUDFLARE_PAGES', 'GITHUB_PAGES', 'HEROKU', 'DIGITAL_OCEAN', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'DEPLOYING', 'READY', 'ERROR', 'CANCELLED', 'ROLLBACK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DeploymentEnvironment" AS ENUM ('PRODUCTION', 'PREVIEW', 'STAGING', 'DEVELOPMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'PENDING', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create core deployment tables
CREATE TABLE IF NOT EXISTS "platform_connections" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" "DeploymentPlatform" NOT NULL,
  "platformName" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenExpiry" TIMESTAMP(3),
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

CREATE TABLE IF NOT EXISTS "deployment_sites" (
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

CREATE TABLE IF NOT EXISTS "deployments" (
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

CREATE TABLE IF NOT EXISTS "deployment_events" (
  "id" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "deployment_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "deployment_logs" (
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

CREATE TABLE IF NOT EXISTS "deployment_runbooks" (
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

CREATE TABLE IF NOT EXISTS "deployment_env_vars" (
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

CREATE TABLE IF NOT EXISTS "deployment_notifications" (
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

-- Indexes
CREATE INDEX IF NOT EXISTS "platform_connections_userId_idx" ON "platform_connections"("userId");
CREATE INDEX IF NOT EXISTS "platform_connections_platform_idx" ON "platform_connections"("platform");
CREATE UNIQUE INDEX IF NOT EXISTS "platform_connections_userId_platform_platformTeamId_key" ON "platform_connections"("userId", "platform", "platformTeamId");

CREATE INDEX IF NOT EXISTS "deployment_sites_connectionId_idx" ON "deployment_sites"("connectionId");
CREATE INDEX IF NOT EXISTS "deployment_sites_projectId_idx" ON "deployment_sites"("projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "deployment_sites_connectionId_platformSiteId_key" ON "deployment_sites"("connectionId", "platformSiteId");

CREATE INDEX IF NOT EXISTS "deployments_siteId_idx" ON "deployments"("siteId");
CREATE INDEX IF NOT EXISTS "deployments_status_idx" ON "deployments"("status");
CREATE INDEX IF NOT EXISTS "deployments_environment_idx" ON "deployments"("environment");
CREATE INDEX IF NOT EXISTS "deployments_createdAt_idx" ON "deployments"("createdAt");
CREATE INDEX IF NOT EXISTS "deployments_siteId_status_createdAt_idx" ON "deployments"("siteId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "deployments_status_environment_createdAt_idx" ON "deployments"("status", "environment", "createdAt");
CREATE INDEX IF NOT EXISTS "deployments_triggeredBy_createdAt_idx" ON "deployments"("triggeredBy", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "deployments_siteId_platformDeploymentId_key" ON "deployments"("siteId", "platformDeploymentId");

CREATE INDEX IF NOT EXISTS "deployment_events_deploymentId_timestamp_idx" ON "deployment_events"("deploymentId", "timestamp");
CREATE INDEX IF NOT EXISTS "deployment_logs_deploymentId_timestamp_idx" ON "deployment_logs"("deploymentId", "timestamp");
CREATE INDEX IF NOT EXISTS "deployment_logs_deploymentId_level_idx" ON "deployment_logs"("deploymentId", "level");
CREATE INDEX IF NOT EXISTS "deployment_runbooks_deploymentId_idx" ON "deployment_runbooks"("deploymentId");
CREATE INDEX IF NOT EXISTS "deployment_runbooks_runbookId_idx" ON "deployment_runbooks"("runbookId");
CREATE UNIQUE INDEX IF NOT EXISTS "deployment_runbooks_deploymentId_runbookId_phase_key" ON "deployment_runbooks"("deploymentId", "runbookId", "phase");
CREATE INDEX IF NOT EXISTS "deployment_env_vars_siteId_idx" ON "deployment_env_vars"("siteId");
CREATE UNIQUE INDEX IF NOT EXISTS "deployment_env_vars_siteId_key_environment_key" ON "deployment_env_vars"("siteId", "key", "environment");
CREATE INDEX IF NOT EXISTS "deployment_notifications_userId_idx" ON "deployment_notifications"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "deployment_notifications_userId_siteId_key" ON "deployment_notifications"("userId", "siteId");

-- Foreign keys (guarded)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployment_sites')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployment_sites_connectionId_fkey') THEN
    ALTER TABLE "deployment_sites"
      ADD CONSTRAINT "deployment_sites_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "platform_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployment_sites')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployment_sites_projectId_fkey') THEN
    ALTER TABLE "deployment_sites"
      ADD CONSTRAINT "deployment_sites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployments')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployments_siteId_fkey') THEN
    ALTER TABLE "deployments"
      ADD CONSTRAINT "deployments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "deployment_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployment_events')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployment_events_deploymentId_fkey') THEN
    ALTER TABLE "deployment_events"
      ADD CONSTRAINT "deployment_events_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployment_logs')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployment_logs_deploymentId_fkey') THEN
    ALTER TABLE "deployment_logs"
      ADD CONSTRAINT "deployment_logs_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deployment_runbooks')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployment_runbooks_deploymentId_fkey') THEN
    ALTER TABLE "deployment_runbooks"
      ADD CONSTRAINT "deployment_runbooks_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
