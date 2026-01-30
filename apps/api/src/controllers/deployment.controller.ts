/**
 * Deployment Controller
 * Handles business logic for deployment-related operations
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  internalServerError,
  paginatedResponse,
  successResponse,
  errorResponse,
  notFoundError,
  permissionError,
} from '../utils/response.util';
import { buildPaginationMeta } from '../utils/pagination.util';
import { aiDeploymentGuardian } from '../services/ai-deployment-guardian.service';
import { platformIntegrationService } from '../services/platform-integration.service';
import { websocketLogsService } from '../services/websocket-logs.service';

// Type alias for prisma client with deployment models (will be available after migration)
const db = prisma as any;

// Type definitions for request bodies
type CreateConnectionRequest = {
  platform: string;
  platformName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  platformUserId?: string;
  platformUsername?: string;
  platformTeamId?: string;
  platformTeamName?: string;
};

type CreateSiteRequest = {
  connectionId: string;
  name: string;
  platformSiteId?: string;
  slug?: string;
  repoOwner: string;
  repoName: string;
  repoProvider?: string;
  repoBranch?: string;
  repoUrl?: string;
  productionUrl?: string;
  previewUrl?: string;
  customDomains?: string[];
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
  outputDir?: string;
  installCommand?: string;
  projectId?: string;
  autoDeployEnabled?: boolean;
  notifyOnDeploy?: boolean;
};

type UpdateSiteRequest = Partial<CreateSiteRequest>;

type CreateDeploymentRequest = {
  siteId: string;
  status: string;
  environment: string;
  platformDeploymentId?: string;
  platformBuildId?: string;
  gitBranch?: string;
  gitCommitSha?: string;
  gitCommitMessage?: string;
  gitAuthor?: string;
  gitAuthorAvatar?: string;
  deploymentUrl?: string;
  inspectUrl?: string;
  triggerType?: string;
};

type UpdateDeploymentRequest = Partial<CreateDeploymentRequest>;

type DeploymentStatus = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'READY' | 'ERROR' | 'CANCELED';
type DeploymentEnvironment = 'PRODUCTION' | 'PREVIEW' | 'STAGING' | 'DEVELOPMENT';

// ============================================================================
// PLATFORM CONNECTIONS
// ============================================================================

/**
 * List all platform connections for the current user
 */
export async function listConnections(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const connections = await db.platformConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { deploymentSites: true },
        },
      },
    });

    // Remove sensitive data
    const sanitizedConnections = connections.map((conn) => ({
      id: conn.id,
      userId: conn.userId,
      platform: conn.platform,
      platformName: conn.platformName,
      platformUserId: conn.platformUserId,
      platformUsername: conn.platformUsername,
      platformTeamId: conn.platformTeamId,
      platformTeamName: conn.platformTeamName,
      status: conn.status,
      lastSyncedAt: conn.lastSyncedAt,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      sitesCount: conn._count.deploymentSites,
    }));

    res.json(successResponse(sanitizedConnections, 'Connections retrieved successfully'));
  } catch (error: any) {
    console.error('Error listing connections:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new platform connection
 */
export async function createConnection(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const data: CreateConnectionRequest = req.body;

    // Check for existing connection
    const existing = await db.platformConnection.findFirst({
      where: {
        userId,
        platform: data.platform,
        platformTeamId: data.platformTeamId || null,
      },
    });

    if (existing) {
      return res.status(400).json(
        errorResponse({
          code: 'CONNECTION_EXISTS',
          message: 'A connection to this platform already exists',
        })
      );
    }

    const connection = await db.platformConnection.create({
      data: {
        userId,
        platform: data.platform,
        platformName: data.platformName,
        accessToken: data.accessToken, // TODO: Encrypt this
        refreshToken: data.refreshToken,
        tokenExpiry: data.tokenExpiry,
        platformUserId: data.platformUserId,
        platformUsername: data.platformUsername,
        platformTeamId: data.platformTeamId,
        platformTeamName: data.platformTeamName,
        status: 'CONNECTED',
        lastSyncedAt: new Date(),
      },
    });

    res.status(201).json(
      successResponse(
        {
          id: connection.id,
          platform: connection.platform,
          platformName: connection.platformName,
          status: connection.status,
        },
        'Connection created successfully'
      )
    );
  } catch (error: any) {
    console.error('Error creating connection:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get a specific connection
 */
export async function getConnection(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const connection = await db.platformConnection.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { deploymentSites: true },
        },
      },
    });

    if (!connection) {
      return res.status(404).json(notFoundError('Connection not found'));
    }

    res.json(
      successResponse(
        {
          id: connection.id,
          userId: connection.userId,
          platform: connection.platform,
          platformName: connection.platformName,
          platformUserId: connection.platformUserId,
          platformUsername: connection.platformUsername,
          platformTeamId: connection.platformTeamId,
          platformTeamName: connection.platformTeamName,
          status: connection.status,
          lastSyncedAt: connection.lastSyncedAt,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          sitesCount: connection._count.deploymentSites,
        },
        'Connection retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error getting connection:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Delete a platform connection
 */
export async function deleteConnection(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const connection = await db.platformConnection.findFirst({
      where: { id, userId },
    });

    if (!connection) {
      return res.status(404).json(notFoundError('Connection not found'));
    }

    await db.platformConnection.delete({ where: { id } });

    res.json(successResponse(null, 'Connection deleted successfully'));
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// DEPLOYMENT SITES
// ============================================================================

/**
 * List all deployment sites for the current user
 */
export async function listSites(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { page = 1, limit = 20, platform, search, projectId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build filters
    const filters: any = {
      connection: {
        userId,
      },
    };

    if (platform) {
      filters.connection.platform = platform;
    }

    if (projectId) {
      filters.projectId = projectId as string;
    }

    if (search) {
      filters.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { repoName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [sites, total] = await Promise.all([
      db.deploymentSite.findMany({
        where: filters,
        skip,
        take,
        orderBy: { lastDeployAt: { sort: 'desc', nulls: 'last' } },
        include: {
          connection: {
            select: {
              platform: true,
              platformName: true,
            },
          },
          deployments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              environment: true,
              gitCommitSha: true,
              gitCommitMessage: true,
              gitBranch: true,
              deploymentUrl: true,
              createdAt: true,
              finishedAt: true,
            },
          },
          _count: {
            select: { deployments: true },
          },
        },
      }),
      db.deploymentSite.count({ where: filters }),
    ]);

    const sitesWithLatest = sites.map((site) => ({
      ...site,
      latestDeployment: site.deployments[0] || null,
      deploymentsCount: site._count.deployments,
      deployments: undefined,
      _count: undefined,
    }));

    res.json(
      paginatedResponse(
        sitesWithLatest,
        buildPaginationMeta(Number(page), Number(limit), total),
        'Sites retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error listing sites:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new deployment site
 */
export async function createSite(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const data: CreateSiteRequest = req.body;

    // Verify connection belongs to user
    const connection = await db.platformConnection.findFirst({
      where: { id: data.connectionId, userId },
    });

    if (!connection) {
      return res.status(404).json(notFoundError('Connection not found'));
    }

    const site = await db.deploymentSite.create({
      data: {
        connectionId: data.connectionId,
        platformSiteId: data.platformSiteId,
        name: data.name,
        slug: data.slug,
        repoProvider: data.repoProvider,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        repoBranch: data.repoBranch || 'main',
        repoUrl: data.repoUrl,
        productionUrl: data.productionUrl,
        previewUrl: data.previewUrl,
        customDomains: data.customDomains || [],
        framework: data.framework,
        buildCommand: data.buildCommand,
        outputDir: data.outputDir,
        installCommand: data.installCommand,
        projectId: data.projectId,
        autoDeployEnabled: data.autoDeployEnabled ?? true,
        notifyOnDeploy: data.notifyOnDeploy ?? true,
      },
      include: {
        connection: {
          select: {
            platform: true,
            platformName: true,
          },
        },
      },
    });

    res.status(201).json(successResponse(site, 'Site created successfully'));
  } catch (error: any) {
    console.error('Error creating site:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get a specific site with details
 */
export async function getSite(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const site = await db.deploymentSite.findFirst({
      where: {
        id,
        connection: { userId },
      },
      include: {
        connection: {
          select: {
            platform: true,
            platformName: true,
            platformUsername: true,
          },
        },
        deployments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { deployments: true },
        },
      },
    });

    if (!site) {
      return res.status(404).json(notFoundError('Site not found'));
    }

    res.json(successResponse(site, 'Site retrieved successfully'));
  } catch (error: any) {
    console.error('Error getting site:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Update a deployment site
 */
export async function updateSite(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    const data: UpdateSiteRequest = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const site = await db.deploymentSite.findFirst({
      where: {
        id,
        connection: { userId },
      },
    });

    if (!site) {
      return res.status(404).json(notFoundError('Site not found'));
    }

    const updated = await db.deploymentSite.update({
      where: { id },
      data,
      include: {
        connection: {
          select: {
            platform: true,
            platformName: true,
          },
        },
      },
    });

    res.json(successResponse(updated, 'Site updated successfully'));
  } catch (error: any) {
    console.error('Error updating site:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Delete a deployment site
 */
export async function deleteSite(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const site = await db.deploymentSite.findFirst({
      where: {
        id,
        connection: { userId },
      },
    });

    if (!site) {
      return res.status(404).json(notFoundError('Site not found'));
    }

    await db.deploymentSite.delete({ where: { id } });

    res.json(successResponse(null, 'Site deleted successfully'));
  } catch (error: any) {
    console.error('Error deleting site:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// DEPLOYMENTS
// ============================================================================

/**
 * List deployments with filtering and pagination
 */
export async function listDeployments(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { page = 1, limit = 20, siteId, status, environment } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const filters: any = {
      site: {
        connection: { userId },
      },
    };

    if (siteId) {
      filters.siteId = siteId as string;
    }

    if (status) {
      filters.status = status as DeploymentStatus;
    }

    if (environment) {
      filters.environment = environment as DeploymentEnvironment;
    }

    const [deployments, total] = await Promise.all([
      db.deployment.findMany({
        where: filters,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          site: {
            select: {
              name: true,
              productionUrl: true,
              connection: {
                select: {
                  platform: true,
                },
              },
            },
          },
        },
      }),
      db.deployment.count({ where: filters }),
    ]);

    res.json(
      paginatedResponse(
        deployments,
        buildPaginationMeta(Number(page), Number(limit), total),
        'Deployments retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error listing deployments:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get a specific deployment with full details
 */
export async function getDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const deployment = await db.deployment.findFirst({
      where: {
        id,
        site: {
          connection: { userId },
        },
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            productionUrl: true,
            repoOwner: true,
            repoName: true,
            repoBranch: true,
            connection: {
              select: {
                platform: true,
                platformName: true,
              },
            },
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    res.json(successResponse(deployment, 'Deployment retrieved successfully'));
  } catch (error: any) {
    console.error('Error getting deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new deployment record
 */
export async function createDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const data: CreateDeploymentRequest = req.body;

    // Verify site belongs to user
    const site = await db.deploymentSite.findFirst({
      where: {
        id: data.siteId,
        connection: { userId },
      },
    });

    if (!site) {
      return res.status(404).json(notFoundError('Site not found'));
    }

    const deployment = await db.deployment.create({
      data: {
        siteId: data.siteId,
        platformDeploymentId: data.platformDeploymentId,
        platformBuildId: data.platformBuildId,
        status: data.status || 'QUEUED',
        environment: data.environment || 'PREVIEW',
        gitCommitSha: data.gitCommitSha,
        gitCommitMessage: data.gitCommitMessage,
        gitBranch: data.gitBranch,
        gitAuthor: data.gitAuthor,
        gitAuthorAvatar: data.gitAuthorAvatar,
        deploymentUrl: data.deploymentUrl,
        inspectUrl: data.inspectUrl,
        triggeredBy: userId,
        triggeredByName: (req.user as any)?.name || 'Unknown',
        triggerType: data.triggerType || 'manual',
      },
      include: {
        site: {
          select: {
            name: true,
            connection: {
              select: { platform: true },
            },
          },
        },
      },
    });

    // Update site's lastDeployAt
    await db.deploymentSite.update({
      where: { id: data.siteId },
      data: { lastDeployAt: new Date() },
    });

    res.status(201).json(successResponse(deployment, 'Deployment created successfully'));
  } catch (error: any) {
    console.error('Error creating deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Update a deployment status
 */
export async function updateDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    const data: UpdateDeploymentRequest = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const deployment = await db.deployment.findFirst({
      where: {
        id,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    const updated = await db.deployment.update({
      where: { id },
      data,
    });

    res.json(successResponse(updated, 'Deployment updated successfully'));
  } catch (error: any) {
    console.error('Error updating deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

/**
 * Get deployment dashboard stats
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get all user's sites
    const sites = await db.deploymentSite.findMany({
      where: {
        connection: { userId },
      },
      select: { id: true },
    });

    const siteIds = sites.map((s) => s.id);

    if (siteIds.length === 0) {
      return res.json(
        successResponse(
          {
            totalSites: 0,
            totalDeployments: 0,
            successfulDeployments: 0,
            failedDeployments: 0,
            averageBuildTime: 0,
            deploymentsToday: 0,
            deploymentsThisWeek: 0,
            platformBreakdown: [],
            recentDeployments: [],
          },
          'Dashboard stats retrieved successfully'
        )
      );
    }

    const [
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      deploymentsToday,
      deploymentsThisWeek,
      avgBuildTime,
      platformBreakdown,
      recentDeployments,
    ] = await Promise.all([
      db.deployment.count({
        where: { siteId: { in: siteIds } },
      }),
      db.deployment.count({
        where: { siteId: { in: siteIds }, status: 'READY' },
      }),
      db.deployment.count({
        where: { siteId: { in: siteIds }, status: 'ERROR' },
      }),
      db.deployment.count({
        where: {
          siteId: { in: siteIds },
          createdAt: { gte: todayStart },
        },
      }),
      db.deployment.count({
        where: {
          siteId: { in: siteIds },
          createdAt: { gte: weekStart },
        },
      }),
      db.deployment.aggregate({
        where: {
          siteId: { in: siteIds },
          buildDuration: { not: null },
        },
        _avg: { buildDuration: true },
      }),
      db.platformConnection.findMany({
        where: { userId },
        select: {
          platform: true,
          _count: {
            select: { deploymentSites: true },
          },
        },
      }),
      db.deployment.findMany({
        where: { siteId: { in: siteIds } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          site: {
            select: {
              name: true,
              connection: {
                select: { platform: true },
              },
            },
          },
        },
      }),
    ]);

    res.json(
      successResponse(
        {
          totalSites: siteIds.length,
          totalDeployments,
          successfulDeployments,
          failedDeployments,
          averageBuildTime: Math.round(avgBuildTime._avg.buildDuration || 0),
          deploymentsToday,
          deploymentsThisWeek,
          platformBreakdown: platformBreakdown.map((p) => ({
            platform: p.platform,
            count: p._count.deploymentSites,
          })),
          recentDeployments,
        },
        'Dashboard stats retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get deployment activity for charts
 */
export async function getDeploymentActivity(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { days = 30 } = req.query;
    const daysNum = Number(days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const sites = await db.deploymentSite.findMany({
      where: { connection: { userId } },
      select: { id: true },
    });

    const siteIds = sites.map((s) => s.id);

    if (siteIds.length === 0) {
      return res.json(successResponse([], 'Deployment activity retrieved successfully'));
    }

    const deployments = await db.deployment.findMany({
      where: {
        siteId: { in: siteIds },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const activityMap = new Map<string, { date: string; success: number; failed: number; total: number }>();

    for (let i = 0; i < daysNum; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityMap.set(dateStr, { date: dateStr, success: 0, failed: 0, total: 0 });
    }

    deployments.forEach((d) => {
      const dateStr = d.createdAt.toISOString().split('T')[0];
      const entry = activityMap.get(dateStr);
      if (entry) {
        entry.total++;
        if (d.status === 'READY') entry.success++;
        if (d.status === 'ERROR') entry.failed++;
      }
    });

    const activity = Array.from(activityMap.values()).reverse();

    res.json(successResponse(activity, 'Deployment activity retrieved successfully'));
  } catch (error: any) {
    console.error('Error getting deployment activity:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// DEPLOYMENT SESSIONS (Collaborative War Room)
// ============================================================================

/**
 * Create a collaborative session for a deployment
 */
export async function createDeploymentSession(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns this deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
      include: {
        site: true,
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    // Check if a session already exists
    if (deployment.sessionId) {
      const existingSession = await db.collaborativeSession.findUnique({
        where: { id: deployment.sessionId },
      });
      if (existingSession) {
        return res.json(successResponse(existingSession, 'Session already exists'));
      }
    }

    // Create a new collaborative session for this deployment
    const session = await db.collaborativeSession.create({
      data: {
        title: `Deployment: ${deployment.site?.name || 'Unknown'} - ${deployment.gitBranch || 'main'}`,
        description: `Collaborative session for deployment ${deployment.id}\nCommit: ${deployment.gitCommitSha || 'N/A'}\nEnvironment: ${deployment.environment}`,
        ownerId: userId,
        language: 'MARKDOWN',
        visibility: 'PRIVATE',
        content: `# Deployment War Room\n\n**Site:** ${deployment.site?.name}\n**Branch:** ${deployment.gitBranch || 'main'}\n**Commit:** ${deployment.gitCommitSha || 'N/A'}\n**Environment:** ${deployment.environment}\n**Status:** ${deployment.status}\n\n## Notes\n\nAdd your deployment notes here...\n\n## Checklist\n\n- [ ] Pre-deployment checks complete\n- [ ] Deployment started\n- [ ] Health checks passing\n- [ ] Post-deployment verification\n`,
      },
    });

    // Link the session to the deployment
    await db.deployment.update({
      where: { id: deploymentId },
      data: { sessionId: session.id },
    });

    // Create deployment event
    await db.deploymentEvent.create({
      data: {
        deploymentId,
        type: 'session_created',
        message: 'Collaborative session created for deployment',
        metadata: {
          sessionId: session.id,
        },
      },
    });

    res.status(201).json(successResponse(session, 'Deployment session created successfully'));
  } catch (error: any) {
    console.error('Error creating deployment session:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get the collaborative session for a deployment
 */
export async function getDeploymentSession(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns this deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    if (!deployment.sessionId) {
      return res.status(404).json(notFoundError('No session exists for this deployment'));
    }

    const session = await db.collaborativeSession.findUnique({
      where: { id: deployment.sessionId },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json(notFoundError('Session not found'));
    }

    res.json(successResponse(session, 'Deployment session retrieved successfully'));
  } catch (error: any) {
    console.error('Error getting deployment session:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// DEPLOYMENT LOGS
// ============================================================================

/**
 * Get deployment logs
 */
export async function getDeploymentLogs(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    const { level, limit = '100' } = req.query;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns this deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    const logs = await db.deploymentLog.findMany({
      where: {
        deploymentId: id,
        ...(level && level !== 'all' ? { level: level as string } : {}),
      },
      orderBy: [
        { timestamp: 'asc' },
        { sequence: 'asc' },
      ],
      take: parseInt(limit as string, 10),
    });

    res.json(successResponse(logs, 'Deployment logs retrieved successfully'));
  } catch (error: any) {
    console.error('Error getting deployment logs:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Add deployment log entry
 */
export async function addDeploymentLog(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    const { level, message, source, metadata, stackTrace } = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns this deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    // Get the next sequence number
    const lastLog = await db.deploymentLog.findFirst({
      where: { deploymentId: id },
      orderBy: { sequence: 'desc' },
    });

    const log = await db.deploymentLog.create({
      data: {
        deploymentId: id,
        level: level || 'info',
        message,
        source,
        metadata,
        stackTrace,
        sequence: (lastLog?.sequence || 0) + 1,
      },
    });

    // Emit log via WebSocket for real-time streaming
    websocketLogsService.emitLog(id, log);

    res.status(201).json(successResponse(log, 'Log entry added successfully'));
  } catch (error: any) {
    console.error('Error adding deployment log:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// ROLLBACK
// ============================================================================

/**
 * Rollback to previous deployment
 */
export async function rollbackDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Get the current deployment
    const currentDeployment = await db.deployment.findFirst({
      where: {
        id,
        site: {
          connection: { userId },
        },
      },
      include: {
        site: true,
      },
    });

    if (!currentDeployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    if (!currentDeployment.canRollback) {
      return res.status(400).json(
        errorResponse({ code: 'ROLLBACK_NOT_ALLOWED', message: 'This deployment cannot be rolled back' })
      );
    }

    // Find the previous successful deployment
    const previousDeployment = await db.deployment.findFirst({
      where: {
        siteId: currentDeployment.siteId,
        status: 'READY',
        id: { not: id },
        createdAt: { lt: currentDeployment.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!previousDeployment) {
      return res.status(400).json(
        errorResponse({ code: 'NO_PREVIOUS_DEPLOYMENT', message: 'No previous successful deployment found to rollback to' })
      );
    }

    // Create a new rollback deployment
    const rollbackDeployment = await db.deployment.create({
      data: {
        siteId: currentDeployment.siteId,
        platformDeploymentId: `rollback-${Date.now()}`,
        status: 'QUEUED',
        environment: previousDeployment.environment,
        gitCommitSha: previousDeployment.gitCommitSha,
        gitCommitMessage: `Rollback to ${previousDeployment.gitCommitSha?.substring(0, 7) || 'previous deployment'}`,
        gitBranch: previousDeployment.gitBranch,
        gitAuthor: previousDeployment.gitAuthor,
        triggeredBy: userId,
        triggeredByName: (req.user as any)?.name || 'User',
        triggerType: 'rollback',
        isRollback: true,
        rollbackFromId: id,
        canRollback: false, // Rollback deployments can't be rolled back
      },
    });

    // Create deployment event
    await db.deploymentEvent.create({
      data: {
        deploymentId: rollbackDeployment.id,
        type: 'rollback_initiated',
        message: `Rollback initiated from deployment ${id} to ${previousDeployment.id}`,
        metadata: {
          fromDeploymentId: id,
          toDeploymentId: previousDeployment.id,
          previousCommitSha: previousDeployment.gitCommitSha,
        },
      },
    });

    // Mark the current deployment as not rollbackable
    await db.deployment.update({
      where: { id },
      data: { canRollback: false },
    });

    res.json(successResponse(rollbackDeployment, 'Rollback initiated successfully'));
  } catch (error: any) {
    console.error('Error rolling back deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// DEPLOYMENT RUNBOOKS (Pre/Post Deployment Workflows)
// ============================================================================

/**
 * Get runbooks linked to a deployment
 */
export async function getDeploymentRunbooks(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    const runbooks = await db.deploymentRunbook.findMany({
      where: { deploymentId },
      orderBy: [{ phase: 'asc' }, { order: 'asc' }],
    });

    res.json(successResponse(runbooks, 'Deployment runbooks retrieved successfully'));
  } catch (error: any) {
    console.error('Error getting deployment runbooks:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Link a runbook to a deployment
 */
export async function linkRunbookToDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId } = req.params;
    const { runbookId, phase, order } = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns the deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    // Verify user owns the runbook
    const runbook = await db.runbook.findFirst({
      where: {
        id: runbookId,
        ownerId: userId,
      },
    });

    if (!runbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    // Create the link
    const link = await db.deploymentRunbook.create({
      data: {
        deploymentId,
        runbookId,
        phase: phase || 'post_deploy',
        order: order || 0,
      },
    });

    // Create deployment event
    await db.deploymentEvent.create({
      data: {
        deploymentId,
        type: 'runbook_linked',
        message: `Runbook "${runbook.name}" linked to ${phase || 'post_deploy'} phase`,
        metadata: {
          runbookId,
          runbookName: runbook.name,
          phase: phase || 'post_deploy',
        },
      },
    });

    res.status(201).json(successResponse(link, 'Runbook linked to deployment successfully'));
  } catch (error: any) {
    console.error('Error linking runbook to deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Execute a deployment runbook
 */
export async function executeDeploymentRunbook(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId, runbookLinkId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns the deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    // Get the runbook link
    const link = await db.deploymentRunbook.findUnique({
      where: { id: runbookLinkId },
    });

    if (!link || link.deploymentId !== deploymentId) {
      return res.status(404).json(notFoundError('Runbook link not found'));
    }

    // Get the runbook
    const runbook = await db.runbook.findUnique({
      where: { id: link.runbookId },
    });

    if (!runbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    // Create a runbook execution
    const execution = await db.runbookExecution.create({
      data: {
        runbookId: link.runbookId,
        status: 'QUEUED',
        triggeredBy: userId,
        triggeredByName: (req.user as any)?.name || 'User',
        triggerType: 'deployment',
        environment: runbook.environment,
        totalSteps: runbook.steps ? (runbook.steps as any[]).length : 0,
        inputParams: {
          deploymentId,
          deploymentStatus: deployment.status,
          gitCommitSha: deployment.gitCommitSha,
          gitBranch: deployment.gitBranch,
          environment: deployment.environment,
        },
      },
    });

    // Update the link with execution info
    await db.deploymentRunbook.update({
      where: { id: runbookLinkId },
      data: {
        executionId: execution.id,
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Create deployment event
    await db.deploymentEvent.create({
      data: {
        deploymentId,
        type: 'runbook_started',
        message: `Runbook "${runbook.name}" execution started`,
        metadata: {
          runbookId: link.runbookId,
          runbookName: runbook.name,
          executionId: execution.id,
          phase: link.phase,
        },
      },
    });

    res.json(successResponse({ link, execution }, 'Runbook execution started'));
  } catch (error: any) {
    console.error('Error executing deployment runbook:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Remove a runbook from a deployment
 */
export async function unlinkRunbookFromDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId, runbookLinkId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns the deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    // Delete the link
    await db.deploymentRunbook.delete({
      where: { id: runbookLinkId },
    });

    res.json(successResponse(null, 'Runbook unlinked from deployment successfully'));
  } catch (error: any) {
    console.error('Error unlinking runbook from deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Trigger a new deployment for a site
 */
export async function triggerDeployment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: siteId } = req.params;
    const { branch, environment } = req.body;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns this site
    const site = await db.deploymentSite.findFirst({
      where: {
        id: siteId,
        connection: { userId },
      },
    });

    if (!site) {
      return res.status(404).json(notFoundError('Site not found'));
    }

    // Trigger deployment on the platform
    const platformResult = await platformIntegrationService.triggerDeployment(siteId, { branch, environment });

    if (!platformResult.success) {
      return res.status(500).json(
        errorResponse({
          code: 'PLATFORM_ERROR',
          message: `Failed to trigger deployment on platform: ${platformResult.error}`,
        })
      );
    }

    // If platform returns a deployment ID, create a record
    // Otherwise, the deployment will be picked up by the next sync
    if (platformResult.platformDeploymentId) {
      const deployment = await db.deployment.create({
        data: {
          siteId,
          platformDeploymentId: platformResult.platformDeploymentId,
          status: 'QUEUED',
          environment: environment || (branch === 'main' || branch === 'master' ? 'PRODUCTION' : 'PREVIEW'),
          gitBranch: branch || site.repoBranch || 'main',
          triggeredBy: userId,
          triggeredByName: (req.user as any)?.name || 'User',
          triggerType: 'manual',
        },
      });

      // Create deployment event
      await db.deploymentEvent.create({
        data: {
          deploymentId: deployment.id,
          type: 'deployment_triggered',
          message: `Manual deployment triggered for branch ${branch || site.repoBranch || 'main'}`,
          metadata: {
            branch: branch || site.repoBranch || 'main',
            environment: deployment.environment,
            triggeredBy: userId,
            platformDeploymentId: platformResult.platformDeploymentId,
          },
        },
      });

      res.status(201).json(successResponse(deployment, 'Deployment triggered successfully'));
    } else {
      // Deployment triggered but no ID returned yet (e.g., deploy hooks)
      // The deployment will appear after the next sync
      res.status(202).json(
        successResponse(
          { 
            message: 'Deployment triggered successfully. It will appear in the list shortly.',
            siteId,
          },
          'Deployment triggered successfully. Sync deployments to see the latest status.'
        )
      );
    }
  } catch (error: any) {
    console.error('Error triggering deployment:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// AI DEPLOYMENT GUARDIAN
// ============================================================================

/**
 * Analyze a deployment for risk factors using AI
 */
export async function analyzeDeploymentRisk(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id: deploymentId } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Verify user owns this deployment
    const deployment = await db.deployment.findFirst({
      where: {
        id: deploymentId,
        site: {
          connection: { userId },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json(notFoundError('Deployment not found'));
    }

    // Perform AI analysis
    const analysis = await aiDeploymentGuardian.analyzeDeployment(deploymentId);

    res.json(successResponse(analysis, 'Deployment risk analysis completed'));
  } catch (error: any) {
    console.error('Error analyzing deployment risk:', error);
    res.status(500).json(internalServerError(error));
  }
}
