/**
 * Deployment Types
 * Type definitions for deployment-related operations
 */

// Define enums locally to avoid dependency on generated Prisma types
export type DeploymentPlatform =
  | 'VERCEL'
  | 'NETLIFY'
  | 'RAILWAY'
  | 'RENDER'
  | 'FLY_IO'
  | 'AWS_AMPLIFY'
  | 'CLOUDFLARE_PAGES'
  | 'GITHUB_PAGES'
  | 'HEROKU'
  | 'DIGITAL_OCEAN'
  | 'CUSTOM';

export type DeploymentStatus =
  | 'QUEUED'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'READY'
  | 'ERROR'
  | 'CANCELLED'
  | 'ROLLBACK';

export type DeploymentEnvironment = 'PRODUCTION' | 'PREVIEW' | 'STAGING' | 'DEVELOPMENT';

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'PENDING' | 'ERROR';

// Platform Connection Types
export interface CreateConnectionRequest {
  platform: DeploymentPlatform;
  platformName: string;
  accessToken: string;
  refreshToken?: string;
  webhookSecret?: string;
  tokenExpiry?: Date;
  platformUserId?: string;
  platformUsername?: string;
  platformTeamId?: string;
  platformTeamName?: string;
}

export interface UpdateConnectionRequest {
  platformName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  status?: ConnectionStatus;
}

// Deployment Site Types
export interface CreateSiteRequest {
  connectionId: string;
  platformSiteId: string;
  name: string;
  slug?: string;
  repoProvider?: string;
  repoOwner?: string;
  repoName?: string;
  repoBranch?: string;
  repoUrl?: string;
  productionUrl?: string;
  previewUrl?: string;
  customDomains?: string[];
  framework?: string;
  buildCommand?: string;
  outputDir?: string;
  installCommand?: string;
  projectId?: string;
  autoDeployEnabled?: boolean;
  notifyOnDeploy?: boolean;
}

export interface UpdateSiteRequest {
  name?: string;
  slug?: string;
  repoBranch?: string;
  productionUrl?: string;
  previewUrl?: string;
  customDomains?: string[];
  framework?: string;
  buildCommand?: string;
  outputDir?: string;
  installCommand?: string;
  projectId?: string;
  autoDeployEnabled?: boolean;
  notifyOnDeploy?: boolean;
}

// Deployment Types
export interface CreateDeploymentRequest {
  siteId: string;
  platformDeploymentId: string;
  platformBuildId?: string;
  status?: DeploymentStatus;
  environment?: DeploymentEnvironment;
  gitCommitSha?: string;
  gitCommitMessage?: string;
  gitBranch?: string;
  gitAuthor?: string;
  gitAuthorAvatar?: string;
  deploymentUrl?: string;
  inspectUrl?: string;
  triggerType?: string;
}

export interface UpdateDeploymentRequest {
  status?: DeploymentStatus;
  deploymentUrl?: string;
  inspectUrl?: string;
  buildDuration?: number;
  buildLogs?: string;
  errorMessage?: string;
  errorCode?: string;
  startedAt?: Date;
  finishedAt?: Date;
}

// Environment Variable Types
export interface CreateEnvVarRequest {
  siteId: string;
  key: string;
  value: string;
  isSecret?: boolean;
  environment?: DeploymentEnvironment;
}

export interface UpdateEnvVarRequest {
  value?: string;
  isSecret?: boolean;
  environment?: DeploymentEnvironment;
}

// Notification Settings Types
export interface UpdateNotificationRequest {
  siteId?: string;
  environment?: DeploymentEnvironment;
  notifyEmail?: boolean;
  notifyInApp?: boolean;
  notifySlack?: boolean;
  slackWebhook?: string;
  notifyDiscord?: boolean;
  discordWebhook?: string;
  onBuildStart?: boolean;
  onBuildSuccess?: boolean;
  onBuildFailure?: boolean;
  onDeploySuccess?: boolean;
  onDeployFailure?: boolean;
}

// Response Types
export interface PlatformConnectionResponse {
  id: string;
  userId: string;
  platform: DeploymentPlatform;
  platformName: string;
  platformUserId?: string;
  platformUsername?: string;
  platformTeamId?: string;
  platformTeamName?: string;
  status: ConnectionStatus;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sitesCount?: number;
}

export interface DeploymentSiteResponse {
  id: string;
  connectionId: string;
  platformSiteId: string;
  name: string;
  slug?: string;
  repoProvider?: string;
  repoOwner?: string;
  repoName?: string;
  repoBranch?: string;
  repoUrl?: string;
  productionUrl?: string;
  previewUrl?: string;
  customDomains: string[];
  framework?: string;
  projectId?: string;
  autoDeployEnabled: boolean;
  notifyOnDeploy: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastDeployAt?: Date;
  connection?: {
    platform: DeploymentPlatform;
    platformName: string;
  };
  latestDeployment?: DeploymentResponse;
  deploymentsCount?: number;
}

export interface DeploymentResponse {
  id: string;
  siteId: string;
  platformDeploymentId: string;
  platformBuildId?: string;
  status: DeploymentStatus;
  environment: DeploymentEnvironment;
  gitCommitSha?: string;
  gitCommitMessage?: string;
  gitBranch?: string;
  gitAuthor?: string;
  gitAuthorAvatar?: string;
  deploymentUrl?: string;
  inspectUrl?: string;
  buildDuration?: number;
  errorMessage?: string;
  errorCode?: string;
  triggeredBy?: string;
  triggeredByName?: string;
  triggerType: string;
  queuedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  site?: {
    name: string;
    productionUrl?: string;
    connection?: {
      platform: DeploymentPlatform;
    };
  };
}

// Dashboard Stats Types
export interface DeploymentStats {
  totalSites: number;
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageBuildTime: number;
  deploymentsToday: number;
  deploymentsThisWeek: number;
  platformBreakdown: {
    platform: DeploymentPlatform;
    count: number;
  }[];
}
