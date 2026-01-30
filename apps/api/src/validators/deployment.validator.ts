/**
 * Deployment Validation Schemas
 * Zod schemas for validating deployment-related requests
 */

import { z } from 'zod';

// Platform types
export const platformEnum = z.enum([
  'VERCEL',
  'NETLIFY',
  'RAILWAY',
  'RENDER',
  'FLY_IO',
  'AWS_AMPLIFY',
  'CLOUDFLARE_PAGES',
  'GITHUB_PAGES',
  'HEROKU',
  'DIGITAL_OCEAN',
  'CUSTOM',
]);

export const deploymentStatusEnum = z.enum([
  'QUEUED',
  'BUILDING',
  'DEPLOYING',
  'READY',
  'ERROR',
  'CANCELLED',
  'ROLLBACK',
]);

export const deploymentEnvironmentEnum = z.enum([
  'PRODUCTION',
  'PREVIEW',
  'STAGING',
  'DEVELOPMENT',
]);

// Connection schemas
export const createConnectionSchema = z.object({
  platform: platformEnum,
  platformName: z.string().min(1).max(100),
  accessToken: z.string().min(10).max(500),
  platformUserId: z.string().optional(),
  platformUsername: z.string().optional(),
  platformTeamId: z.string().optional(),
  platformTeamName: z.string().optional(),
});

export const updateConnectionSchema = z.object({
  platformName: z.string().min(1).max(100).optional(),
  accessToken: z.string().min(10).max(500).optional(),
  platformUserId: z.string().optional(),
  platformUsername: z.string().optional(),
  platformTeamId: z.string().optional(),
  platformTeamName: z.string().optional(),
});

// Site schemas
export const createSiteSchema = z.object({
  connectionId: z.string().uuid(),
  platformSiteId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  productionUrl: z.string().url().optional(),
  repoOwner: z.string().optional(),
  repoName: z.string().optional(),
  repoBranch: z.string().optional(),
  framework: z.string().optional(),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  productionUrl: z.string().url().optional(),
  repoOwner: z.string().optional(),
  repoName: z.string().optional(),
  repoBranch: z.string().optional(),
  framework: z.string().optional(),
});

// Deployment schemas
export const createDeploymentSchema = z.object({
  siteId: z.string().uuid(),
  platformDeploymentId: z.string().min(1).max(255),
  platformBuildId: z.string().optional(),
  status: deploymentStatusEnum,
  environment: deploymentEnvironmentEnum,
  gitCommitSha: z.string().optional(),
  gitCommitMessage: z.string().optional(),
  gitBranch: z.string().optional(),
  gitAuthor: z.string().optional(),
  gitAuthorAvatar: z.string().url().optional(),
  deploymentUrl: z.string().url().optional(),
  inspectUrl: z.string().url().optional(),
  buildDuration: z.number().int().positive().optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
  triggeredBy: z.string().optional(),
  triggeredByName: z.string().optional(),
  triggerType: z.string().default('manual'),
  queuedAt: z.string().datetime().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

export const updateDeploymentSchema = z.object({
  status: deploymentStatusEnum.optional(),
  buildDuration: z.number().int().positive().optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
  deploymentUrl: z.string().url().optional(),
  inspectUrl: z.string().url().optional(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
});

// Query parameter schemas
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const deploymentListQuerySchema = paginationQuerySchema.extend({
  siteId: z.string().uuid().optional(),
  status: deploymentStatusEnum.optional(),
  environment: deploymentEnvironmentEnum.optional(),
  search: z.string().optional(),
});

export const siteListQuerySchema = paginationQuerySchema.extend({
  connectionId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Sync schemas
export const syncSitesSchema = z.object({
  connectionId: z.string().uuid(),
  limit: z.number().int().positive().max(100).optional(),
});

export const syncDeploymentsSchema = z.object({
  siteId: z.string().uuid(),
  limit: z.number().int().positive().max(100).optional(),
});

// Webhook schemas
export const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.record(z.any()),
  signature: z.string().optional(),
});

// Deployment session schemas
export const createDeploymentSessionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deploymentIds: z.array(z.string().uuid()).optional(),
});

export const updateDeploymentSessionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'RESOLVED', 'ARCHIVED']).optional(),
});

// Export types
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
export type UpdateDeploymentInput = z.infer<typeof updateDeploymentSchema>;
export type DeploymentListQuery = z.infer<typeof deploymentListQuerySchema>;
export type SiteListQuery = z.infer<typeof siteListQuerySchema>;
