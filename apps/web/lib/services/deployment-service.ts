/**
 * Deployment Service
 * API calls for deployment-related operations
 */

import { apiRequest, apiRequestPaginated, type PaginatedResult } from '../utils/api-client';

// Types
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

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: DeploymentPlatform;
  platformName: string;
  platformUserId?: string;
  platformUsername?: string;
  platformTeamId?: string;
  platformTeamName?: string;
  status: ConnectionStatus;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  sitesCount?: number;
}

export interface DeploymentSite {
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
  createdAt: string;
  updatedAt: string;
  lastDeployAt?: string;
  connection?: {
    platform: DeploymentPlatform;
    platformName: string;
  };
  latestDeployment?: Deployment;
  deploymentsCount?: number;
}

export interface Deployment {
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
  queuedAt: string;
  // AI fields
  riskScore?: number;
  riskFactors?: Array<{ category: string; severity: string; description: string; impact: string }>;
  aiSummary?: string;
  aiSuggestions?: string[];
  // Rollback fields
  isRollback?: boolean;
  rollbackFromId?: string;
  canRollback?: boolean;
  // Collaboration
  sessionId?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  site?: {
    id?: string;
    name: string;
    productionUrl?: string;
    repoOwner?: string;
    repoName?: string;
    repoBranch?: string;
    connection?: {
      platform: DeploymentPlatform;
      platformName?: string;
    };
  };
  events?: DeploymentEvent[];
}

export interface DeploymentEvent {
  id: string;
  deploymentId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: string;
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  timestamp: string;
  sequence: number;
}

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
  recentDeployments: Deployment[];
}

export interface DeploymentActivity {
  date: string;
  success: number;
  failed: number;
  total: number;
}

// Request types
export interface CreateConnectionRequest {
  platform: DeploymentPlatform;
  platformName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: string;
  platformUserId?: string;
  platformUsername?: string;
  platformTeamId?: string;
  platformTeamName?: string;
}

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
  projectId?: string;
  autoDeployEnabled?: boolean;
  notifyOnDeploy?: boolean;
}

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

export async function getDashboardStats(): Promise<{ success: boolean; data: DeploymentStats | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<DeploymentStats>('/deployments/dashboard/stats');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function getDeploymentActivity(
  days: number = 30
): Promise<{ success: boolean; data: DeploymentActivity[] | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<DeploymentActivity[]>(`/deployments/dashboard/activity?days=${days}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

// ============================================================================
// PLATFORM CONNECTIONS
// ============================================================================

export async function getConnections(): Promise<{ success: boolean; data: PlatformConnection[] | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<PlatformConnection[]>('/deployments/connections');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function createConnection(
  data: CreateConnectionRequest
): Promise<{ success: boolean; data: PlatformConnection | null; error?: { message: string } }> {
  try {
    const result = await apiRequest<PlatformConnection>('/deployments/connections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function getConnection(id: string): Promise<{ success: boolean; data: PlatformConnection | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<PlatformConnection>(`/deployments/connections/${id}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function deleteConnection(id: string): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    await apiRequest<null>(`/deployments/connections/${id}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

// ============================================================================
// DEPLOYMENT SITES
// ============================================================================

export interface GetSitesParams {
  page?: number;
  limit?: number;
  platform?: DeploymentPlatform;
  search?: string;
  projectId?: string;
}

export async function getSites(
  params: GetSitesParams = {}
): Promise<{ success: boolean; data: DeploymentSite[] | null; error?: { message: string } }> {
  try {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.platform) searchParams.set('platform', params.platform);
    if (params.search) searchParams.set('search', params.search);
    if (params.projectId) searchParams.set('projectId', params.projectId);

    const query = searchParams.toString();
    const result = await apiRequestPaginated<DeploymentSite>(`/deployments/sites${query ? `?${query}` : ''}`);
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function createSite(data: CreateSiteRequest): Promise<{ success: boolean; data: DeploymentSite | null; error?: { message: string } }> {
  try {
    const result = await apiRequest<DeploymentSite>('/deployments/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function getSite(id: string): Promise<{ success: boolean; data: DeploymentSite | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<DeploymentSite>(`/deployments/sites/${id}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function updateSite(
  id: string,
  data: UpdateSiteRequest
): Promise<{ success: boolean; data: DeploymentSite | null; error?: { message: string } }> {
  try {
    const result = await apiRequest<DeploymentSite>(`/deployments/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function deleteSite(id: string): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    await apiRequest<null>(`/deployments/sites/${id}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

// ============================================================================
// DEPLOYMENTS
// ============================================================================

export interface GetDeploymentsParams {
  page?: number;
  limit?: number;
  siteId?: string;
  status?: DeploymentStatus;
  environment?: DeploymentEnvironment;
}

export async function getDeployments(
  params: GetDeploymentsParams = {}
): Promise<{ success: boolean; data: Deployment[] | null; error?: { message: string } }> {
  try {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.siteId) searchParams.set('siteId', params.siteId);
    if (params.status) searchParams.set('status', params.status);
    if (params.environment) searchParams.set('environment', params.environment);

    const query = searchParams.toString();
    const result = await apiRequestPaginated<Deployment>(`/deployments${query ? `?${query}` : ''}`);
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function getDeployment(id: string): Promise<{ success: boolean; data: Deployment | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<Deployment>(`/deployments/${id}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function getDeploymentLogs(
  deploymentId: string,
  params: { level?: string; limit?: number } = {}
): Promise<{ success: boolean; data: DeploymentLog[] | null; error?: { message: string } }> {
  try {
    const searchParams = new URLSearchParams();
    if (params.level) searchParams.set('level', params.level);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    
    const query = searchParams.toString();
    const data = await apiRequest<DeploymentLog[]>(
      `/deployments/${deploymentId}/logs${query ? `?${query}` : ''}`
    );
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function rollbackDeployment(
  deploymentId: string
): Promise<{ success: boolean; data: Deployment | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<Deployment>(`/deployments/${deploymentId}/rollback`, {
      method: 'POST',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function triggerDeployment(
  siteId: string,
  options: { branch?: string; environment?: DeploymentEnvironment } = {}
): Promise<{ success: boolean; data: Deployment | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<Deployment>(`/deployments/sites/${siteId}/deploy`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

// ============================================================================
// DEPLOYMENT SESSIONS (Collaborative War Room)
// ============================================================================

export interface DeploymentSession {
  id: string;
  title: string;
  description?: string;
  content?: string;
  language: string;
  visibility: string;
  ownerId: string;
  owner?: {
    id: string;
    name?: string;
    username: string;
    avatar?: string;
  };
  permissions?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name?: string;
      username: string;
      avatar?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function createDeploymentSession(
  deploymentId: string
): Promise<{ success: boolean; data: DeploymentSession | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<DeploymentSession>(`/deployments/${deploymentId}/session`, {
      method: 'POST',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

export async function getDeploymentSession(
  deploymentId: string
): Promise<{ success: boolean; data: DeploymentSession | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<DeploymentSession>(`/deployments/${deploymentId}/session`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

// ============================================================================
// AI DEPLOYMENT GUARDIAN
// ============================================================================

export interface DeploymentRiskAnalysis {
  riskScore: number;
  riskLevel: string;
  riskFactors: Array<{ category: string; severity: string; description: string; impact: string }>;
  aiSummary: string;
  aiSuggestions: string[];
  analyzedAt: string;
}

export async function analyzeDeploymentRisk(
  deploymentId: string
): Promise<{ success: boolean; data: DeploymentRiskAnalysis | null; error?: { message: string } }> {
  try {
    const data = await apiRequest<{
      riskScore: number;
      riskLevel: string;
      riskFactors: Array<{ category: string; severity: string; description: string; impact: string }>;
      aiSummary: string;
      aiSuggestions: string[];
      analyzedAt: string;
    }>(`/deployments/${deploymentId}/analyze`, {
      method: 'POST',
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null, error: { message: error.message } };
  }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync sites from Vercel for a connection
 */
export async function syncVercelSites(connectionId: string, limit: number = 100) {
  return apiRequest<{
    synced: number;
    sites: DeploymentSite[];
  }>(`/deployments/connections/${connectionId}/sync-sites?limit=${limit}`, {
    method: 'POST',
  });
}

/**
 * Sync deployments for a site from Vercel
 */
export async function syncSiteDeployments(siteId: string, limit: number = 20) {
  return apiRequest<{
    synced: number;
    deployments: Deployment[];
  }>(`/deployments/sites/${siteId}/sync-deployments?limit=${limit}`, {
    method: 'POST',
  });
}

/**
 * Sync logs for a deployment from Vercel
 */
export async function syncDeploymentLogs(deploymentId: string) {
  return apiRequest<{
    synced: number;
    logs: any[];
  }>(`/deployments/${deploymentId}/sync-logs`, {
    method: 'POST',
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getStatusColor(status: DeploymentStatus): string {
  switch (status) {
    case 'READY':
      return 'text-green-500';
    case 'BUILDING':
    case 'DEPLOYING':
    case 'QUEUED':
      return 'text-yellow-500';
    case 'ERROR':
      return 'text-red-500';
    case 'CANCELLED':
      return 'text-gray-500';
    case 'ROLLBACK':
      return 'text-orange-500';
    default:
      return 'text-gray-500';
  }
}

export function getStatusBgColor(status: DeploymentStatus): string {
  switch (status) {
    case 'READY':
      return 'bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/20';
    case 'BUILDING':
    case 'DEPLOYING':
    case 'QUEUED':
      return 'bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20';
    case 'ERROR':
      return 'bg-rose-500/20 text-rose-300 shadow-sm shadow-rose-500/20';
    case 'CANCELLED':
      return 'bg-slate-500/20 text-slate-300 shadow-sm shadow-slate-500/20';
    case 'ROLLBACK':
      return 'bg-orange-500/20 text-orange-300 shadow-sm shadow-orange-500/20';
    default:
      return 'bg-slate-500/20 text-slate-300 shadow-sm shadow-slate-500/20';
  }
}

export function getPlatformIcon(platform: DeploymentPlatform): string {
  switch (platform) {
    case 'VERCEL':
      return '▲';
    case 'NETLIFY':
      return '◆';
    case 'RAILWAY':
      return '🚂';
    case 'RENDER':
      return '⬡';
    case 'FLY_IO':
      return '✈️';
    case 'AWS_AMPLIFY':
      return '☁️';
    case 'CLOUDFLARE_PAGES':
      return '🔶';
    case 'GITHUB_PAGES':
      return '📄';
    case 'HEROKU':
      return '🟣';
    case 'DIGITAL_OCEAN':
      return '🌊';
    default:
      return '🚀';
  }
}

export function getPlatformName(platform: DeploymentPlatform): string {
  switch (platform) {
    case 'VERCEL':
      return 'Vercel';
    case 'NETLIFY':
      return 'Netlify';
    case 'RAILWAY':
      return 'Railway';
    case 'RENDER':
      return 'Render';
    case 'FLY_IO':
      return 'Fly.io';
    case 'AWS_AMPLIFY':
      return 'AWS Amplify';
    case 'CLOUDFLARE_PAGES':
      return 'Cloudflare Pages';
    case 'GITHUB_PAGES':
      return 'GitHub Pages';
    case 'HEROKU':
      return 'Heroku';
    case 'DIGITAL_OCEAN':
      return 'DigitalOcean';
    default:
      return 'Custom';
  }
}

export function formatBuildDuration(seconds?: number): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function getEnvironmentBadgeColor(env: DeploymentEnvironment): string {
  switch (env) {
    case 'PRODUCTION':
      return 'bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/20';
    case 'PREVIEW':
      return 'bg-sky-500/20 text-sky-300 shadow-sm shadow-sky-500/20';
    case 'STAGING':
      return 'bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20';
    case 'DEVELOPMENT':
      return 'bg-purple-500/20 text-purple-300 shadow-sm shadow-purple-500/20';
    default:
      return 'bg-slate-500/20 text-slate-300 shadow-sm shadow-slate-500/20';
  }
}
