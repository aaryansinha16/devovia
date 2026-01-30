/**
 * Vercel Sync Controller
 * Syncs sites and deployments from Vercel
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  internalServerError,
  successResponse,
  errorResponse,
} from '../utils/response.util';

const db = prisma as any;

/**
 * Sync sites from Vercel
 */
export async function syncVercelSites(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { connectionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100; // Default to 100 sites

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Get the connection
    const connection = await db.platformConnection.findFirst({
      where: {
        id: connectionId,
        userId,
        platform: 'VERCEL',
      },
    });

    if (!connection) {
      return res.status(404).json(errorResponse({ code: 'NOT_FOUND', message: 'Vercel connection not found' }));
    }

    // Fetch projects from Vercel API with limit
    const vercelResponse = await fetch(`https://api.vercel.com/v9/projects?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
    });

    if (!vercelResponse.ok) {
      return res.status(400).json(
        errorResponse({
          code: 'VERCEL_API_ERROR',
          message: 'Failed to fetch projects from Vercel',
        })
      );
    }

    const vercelData = await vercelResponse.json();
    const projects = vercelData.projects || [];

    // Create or update sites
    const syncedSites = [];
    for (const project of projects) {
      // Check if site already exists
      const existingSite = await db.deploymentSite.findFirst({
        where: {
          connectionId: connection.id,
          platformSiteId: project.id,
        },
      });

      if (existingSite) {
        // Update existing site
        const updated = await db.deploymentSite.update({
          where: { id: existingSite.id },
          data: {
            name: project.name,
            productionUrl: project.targets?.production?.url || `https://${project.name}.vercel.app`,
            framework: project.framework || 'nextjs',
            updatedAt: new Date(),
          },
        });
        syncedSites.push(updated);
      } else {
        // Create new site
        const created = await db.deploymentSite.create({
          data: {
            connectionId: connection.id,
            platformSiteId: project.id,
            name: project.name,
            slug: project.name,
            repoOwner: project.link?.org || '',
            repoName: project.link?.repo || project.name,
            repoProvider: project.link?.type || 'github',
            repoBranch: project.productionBranch || 'main',
            repoUrl: project.link?.repoId ? `https://github.com/${project.link.org}/${project.link.repo}` : '',
            productionUrl: project.targets?.production?.url || `https://${project.name}.vercel.app`,
            framework: project.framework || 'nextjs',
            buildCommand: project.buildCommand || 'npm run build',
            outputDir: project.outputDirectory || '.next',
            installCommand: project.installCommand || 'npm install',
            autoDeployEnabled: project.autoExposeSystemEnvs !== false,
            notifyOnDeploy: true,
          },
        });
        syncedSites.push(created);
      }
    }

    // Update connection last synced time
    await db.platformConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() },
    });

    res.json(
      successResponse(
        {
          synced: syncedSites.length,
          sites: syncedSites,
        },
        `Successfully synced ${syncedSites.length} sites from Vercel`
      )
    );
  } catch (error: any) {
    console.error('Error syncing Vercel sites:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Sync deployments for a site from Vercel
 */
export async function syncVercelDeployments(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { siteId } = req.params;
    const { limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    // Get the site with connection
    const site = await db.deploymentSite.findFirst({
      where: {
        id: siteId,
        connection: { userId },
      },
      include: {
        connection: true,
      },
    });

    if (!site) {
      return res.status(404).json(errorResponse({ code: 'NOT_FOUND', message: 'Site not found' }));
    }

    if (site.connection.platform !== 'VERCEL') {
      return res.status(400).json(
        errorResponse({
          code: 'INVALID_PLATFORM',
          message: 'This endpoint only supports Vercel sites',
        })
      );
    }

    // Fetch deployments from Vercel API
    const vercelResponse = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${site.platformSiteId}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${site.connection.accessToken}`,
        },
      }
    );

    if (!vercelResponse.ok) {
      return res.status(400).json(
        errorResponse({
          code: 'VERCEL_API_ERROR',
          message: 'Failed to fetch deployments from Vercel',
        })
      );
    }

    const vercelData = await vercelResponse.json();
    const deployments = vercelData.deployments || [];

    // Create or update deployments
    const syncedDeployments = [];
    for (const deployment of deployments) {
      // Check if deployment already exists
      const existing = await db.deployment.findFirst({
        where: {
          siteId: site.id,
          platformDeploymentId: deployment.uid,
        },
      });

      const deploymentData = {
        siteId: site.id,
        platformDeploymentId: deployment.uid,
        status: mapVercelState(deployment.state),
        environment: deployment.target === 'production' ? 'PRODUCTION' : 'PREVIEW',
        gitBranch: deployment.meta?.githubCommitRef || site.repoBranch,
        gitCommitSha: deployment.meta?.githubCommitSha,
        gitCommitMessage: deployment.meta?.githubCommitMessage,
        gitAuthor: deployment.meta?.githubCommitAuthorName,
        deploymentUrl: `https://${deployment.url}`,
        inspectUrl: `https://vercel.com/${site.connection.platformUsername}/${site.slug}/${deployment.uid}`,
        buildDuration: deployment.buildingAt && deployment.ready ? deployment.ready - deployment.buildingAt : null,
        queuedAt: deployment.createdAt ? new Date(deployment.createdAt) : new Date(),
        startedAt: deployment.buildingAt ? new Date(deployment.buildingAt) : null,
        finishedAt: deployment.ready ? new Date(deployment.ready) : null,
        errorMessage: deployment.state === 'ERROR' ? 'Deployment failed' : null,
        triggerType: 'webhook',
      };

      if (existing) {
        // Update existing deployment
        const updated = await db.deployment.update({
          where: { id: existing.id },
          data: deploymentData,
        });
        syncedDeployments.push(updated);
      } else {
        // Create new deployment
        const created = await db.deployment.create({
          data: deploymentData,
        });
        syncedDeployments.push(created);
      }
    }

    res.json(
      successResponse(
        {
          synced: syncedDeployments.length,
          deployments: syncedDeployments,
        },
        `Successfully synced ${syncedDeployments.length} deployments from Vercel`
      )
    );
  } catch (error: any) {
    console.error('Error syncing Vercel deployments:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Sync logs for a specific deployment from Vercel
 */
export async function syncDeploymentLogs(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get the deployment with site and connection
    const deployment = await db.deployment.findUnique({
      where: { id },
      include: {
        site: {
          include: { connection: true },
        },
      },
    });

    if (!deployment || !deployment.site?.connection) {
      return res.status(404).json(
        errorResponse({
          code: 'NOT_FOUND',
          message: 'Deployment or connection not found',
        })
      );
    }

    const { site } = deployment;
    const { connection } = site;

    // Fetch logs from Vercel
    const vercelResponse = await fetch(
      `https://api.vercel.com/v2/deployments/${deployment.platformDeploymentId}/events`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
      }
    );

    if (!vercelResponse.ok) {
      return res.status(500).json(
        errorResponse({
          code: 'VERCEL_API_ERROR',
          message: 'Failed to fetch logs from Vercel',
        })
      );
    }

    const logsData = await vercelResponse.json();
    const events = logsData || [];

    // Store logs in database
    let sequence = 0;
    const syncedLogs = [];

    for (const event of events) {
      // Check if log already exists
      const existingLog = await db.deploymentLog.findFirst({
        where: {
          deploymentId: deployment.id,
          message: event.text || event.payload?.text || '',
          timestamp: new Date(event.created || event.createdAt),
        },
      });

      if (!existingLog) {
        const logData = {
          deploymentId: deployment.id,
          level: event.type === 'error' ? 'error' : event.type === 'warning' ? 'warn' : 'info',
          message: event.text || event.payload?.text || JSON.stringify(event),
          source: event.type || 'vercel',
          timestamp: new Date(event.created || event.createdAt || Date.now()),
          sequence: sequence++,
        };

        const created = await db.deploymentLog.create({
          data: logData,
        });
        syncedLogs.push(created);
      }
    }

    res.json(
      successResponse(
        {
          synced: syncedLogs.length,
          logs: syncedLogs,
        },
        `Successfully synced ${syncedLogs.length} logs from Vercel`
      )
    );
  } catch (error: any) {
    console.error('Error syncing Vercel logs:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Map Vercel deployment state to our status
 */
function mapVercelState(state: string): string {
  switch (state) {
    case 'READY':
      return 'READY';
    case 'BUILDING':
      return 'BUILDING';
    case 'ERROR':
      return 'ERROR';
    case 'CANCELED':
      return 'CANCELED';
    case 'QUEUED':
      return 'QUEUED';
    default:
      return 'QUEUED';
  }
}
