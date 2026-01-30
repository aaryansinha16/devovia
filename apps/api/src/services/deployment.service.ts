/**
 * Deployment Service
 * Business logic layer for deployment operations
 */

import prisma from '../lib/prisma';
import { encrypt, decrypt } from '../utils/encryption.util';
import { normalizePagination, buildPaginationMeta } from '../utils/pagination.util';
import { PaginationMeta } from '../types/api.types';
import {
  CreateConnectionInput,
  UpdateConnectionInput,
  CreateSiteInput,
  UpdateSiteInput,
  CreateDeploymentInput,
  UpdateDeploymentInput,
} from '../validators/deployment.validator';

// Type alias for prisma client with deployment models
const db = prisma as any;

// ============================================================================
// PLATFORM CONNECTIONS
// ============================================================================

export class DeploymentService {
  /**
   * List all platform connections for a user
   */
  async listConnections(userId: string) {
    const connections = await db.platformConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sites: true },
        },
      },
    });

    // Decrypt access tokens for display (mask them)
    return connections.map((conn: any) => ({
      ...conn,
      accessToken: conn.accessToken ? '***' + conn.accessToken.slice(-4) : undefined,
      sitesCount: conn._count.sites,
    }));
  }

  /**
   * Get a single platform connection
   */
  async getConnection(connectionId: string, userId: string) {
    const connection = await db.platformConnection.findFirst({
      where: { id: connectionId, userId },
      include: {
        _count: {
          select: { sites: true },
        },
      },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    return {
      ...connection,
      accessToken: connection.accessToken ? '***' + connection.accessToken.slice(-4) : undefined,
      sitesCount: connection._count.sites,
    };
  }

  /**
   * Create a new platform connection
   */
  async createConnection(userId: string, data: CreateConnectionInput) {
    // Check if connection already exists
    const existing = await db.platformConnection.findFirst({
      where: {
        userId,
        platform: data.platform,
      },
    });

    if (existing) {
      throw new Error('A connection to this platform already exists');
    }

    // Encrypt the access token before storing
    const encryptedToken = encrypt(data.accessToken);

    const connection = await db.platformConnection.create({
      data: {
        userId,
        platform: data.platform,
        platformName: data.platformName,
        accessToken: encryptedToken,
        platformUserId: data.platformUserId,
        platformUsername: data.platformUsername,
        platformTeamId: data.platformTeamId,
        platformTeamName: data.platformTeamName,
        status: 'CONNECTED',
      },
    });

    return {
      ...connection,
      accessToken: '***' + data.accessToken.slice(-4),
    };
  }

  /**
   * Update a platform connection
   */
  async updateConnection(connectionId: string, userId: string, data: UpdateConnectionInput) {
    const connection = await db.platformConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const updateData: any = { ...data };

    // Encrypt access token if provided
    if (data.accessToken) {
      updateData.accessToken = encrypt(data.accessToken);
    }

    const updated = await db.platformConnection.update({
      where: { id: connectionId },
      data: updateData,
    });

    return {
      ...updated,
      accessToken: updated.accessToken ? '***' + updated.accessToken.slice(-4) : undefined,
    };
  }

  /**
   * Delete a platform connection
   */
  async deleteConnection(connectionId: string, userId: string) {
    const connection = await db.platformConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    await db.platformConnection.delete({
      where: { id: connectionId },
    });

    return { id: connectionId };
  }

  /**
   * Get decrypted access token for a connection (internal use only)
   */
  async getDecryptedAccessToken(connectionId: string, userId: string): Promise<string> {
    const connection = await db.platformConnection.findFirst({
      where: { id: connectionId, userId },
      select: { accessToken: true },
    });

    if (!connection || !connection.accessToken) {
      throw new Error('Connection or access token not found');
    }

    return decrypt(connection.accessToken);
  }

  // ============================================================================
  // SITES
  // ============================================================================

  /**
   * List sites with pagination
   */
  async listSites(
    userId: string,
    query: { page?: number; limit?: number; connectionId?: string; search?: string }
  ) {
    const { page, limit, offset } = normalizePagination({
      page: query.page,
      limit: query.limit,
    });

    const where: any = {
      connection: { userId },
    };

    if (query.connectionId) {
      where.connectionId = query.connectionId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { productionUrl: { contains: query.search, mode: 'insensitive' } },
        { repoName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [sites, total] = await Promise.all([
      db.deploymentSite.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          connection: {
            select: {
              platform: true,
              platformName: true,
            },
          },
          _count: {
            select: { deployments: true },
          },
        },
      }),
      db.deploymentSite.count({ where }),
    ]);

    const pagination = buildPaginationMeta(page, limit, total);

    return {
      sites: sites.map((site: any) => ({
        ...site,
        deploymentsCount: site._count.deployments,
      })),
      pagination,
    };
  }

  /**
   * Get a single site
   */
  async getSite(siteId: string, userId: string) {
    const site = await db.deploymentSite.findFirst({
      where: {
        id: siteId,
        connection: { userId },
      },
      include: {
        connection: {
          select: {
            platform: true,
            platformName: true,
          },
        },
        _count: {
          select: { deployments: true },
        },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    return {
      ...site,
      deploymentsCount: site._count.deployments,
    };
  }

  /**
   * Create a new site
   */
  async createSite(userId: string, data: CreateSiteInput) {
    // Verify connection ownership
    const connection = await db.platformConnection.findFirst({
      where: { id: data.connectionId, userId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const site = await db.deploymentSite.create({
      data: {
        connectionId: data.connectionId,
        platformSiteId: data.platformSiteId,
        name: data.name,
        productionUrl: data.productionUrl,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        repoBranch: data.repoBranch,
        framework: data.framework,
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

    return site;
  }

  /**
   * Update a site
   */
  async updateSite(siteId: string, userId: string, data: UpdateSiteInput) {
    const site = await db.deploymentSite.findFirst({
      where: {
        id: siteId,
        connection: { userId },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    const updated = await db.deploymentSite.update({
      where: { id: siteId },
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

    return updated;
  }

  /**
   * Delete a site
   */
  async deleteSite(siteId: string, userId: string) {
    const site = await db.deploymentSite.findFirst({
      where: {
        id: siteId,
        connection: { userId },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    await db.deploymentSite.delete({
      where: { id: siteId },
    });

    return { id: siteId };
  }

  // ============================================================================
  // DEPLOYMENTS
  // ============================================================================

  /**
   * List deployments with pagination and filters
   */
  async listDeployments(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      siteId?: string;
      status?: string;
      environment?: string;
      search?: string;
    }
  ) {
    const { page, limit, offset } = normalizePagination({
      page: query.page,
      limit: query.limit,
    });

    const where: any = {
      site: {
        connection: { userId },
      },
    };

    if (query.siteId) {
      where.siteId = query.siteId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.environment) {
      where.environment = query.environment;
    }

    if (query.search) {
      where.OR = [
        { gitCommitMessage: { contains: query.search, mode: 'insensitive' } },
        { gitBranch: { contains: query.search, mode: 'insensitive' } },
        { gitAuthor: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [deployments, total] = await Promise.all([
      db.deployment.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          site: {
            select: {
              id: true,
              name: true,
              productionUrl: true,
              connection: {
                select: {
                  platform: true,
                  platformName: true,
                },
              },
            },
          },
        },
      }),
      db.deployment.count({ where }),
    ]);

    const pagination = buildPaginationMeta(page, limit, total);

    return { deployments, pagination };
  }

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(userId: string) {
    // Get all user's sites
    const sites = await db.deploymentSite.findMany({
      where: { connection: { userId } },
      select: { id: true },
    });

    const siteIds = sites.map((s: any) => s.id);

    if (siteIds.length === 0) {
      return {
        totalSites: 0,
        totalDeployments: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        averageBuildTime: 0,
        deploymentsToday: 0,
        deploymentsThisWeek: 0,
        deploymentsThisMonth: 0,
        recentDeployments: [],
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Use aggregation to get stats efficiently
    const [
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      avgBuildTime,
      deploymentsToday,
      deploymentsThisWeek,
      deploymentsThisMonth,
      recentDeployments,
    ] = await Promise.all([
      db.deployment.count({ where: { siteId: { in: siteIds } } }),
      db.deployment.count({ where: { siteId: { in: siteIds }, status: 'READY' } }),
      db.deployment.count({ where: { siteId: { in: siteIds }, status: 'ERROR' } }),
      db.deployment.aggregate({
        where: { siteId: { in: siteIds }, buildDuration: { not: null } },
        _avg: { buildDuration: true },
      }),
      db.deployment.count({
        where: { siteId: { in: siteIds }, createdAt: { gte: today } },
      }),
      db.deployment.count({
        where: { siteId: { in: siteIds }, createdAt: { gte: weekAgo } },
      }),
      db.deployment.count({
        where: { siteId: { in: siteIds }, createdAt: { gte: monthAgo } },
      }),
      db.deployment.findMany({
        where: { siteId: { in: siteIds } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          site: {
            select: {
              name: true,
              connection: {
                select: {
                  platform: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalSites: sites.length,
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      averageBuildTime: Math.round(avgBuildTime._avg.buildDuration || 0),
      deploymentsToday,
      deploymentsThisWeek,
      deploymentsThisMonth,
      recentDeployments,
    };
  }
}

export const deploymentService = new DeploymentService();
