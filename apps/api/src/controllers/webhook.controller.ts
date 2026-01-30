/**
 * Webhook Controller
 * Handles incoming webhooks from GitHub, GitLab, and deployment platforms
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import {
  successResponse,
  errorResponse,
  internalServerError,
} from '../utils/response.util';

// Type alias for prisma client with deployment models
const db = prisma as any;

// ============================================================================
// GITHUB WEBHOOKS
// ============================================================================

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Handle GitHub webhook events
 * Supports: push, deployment, deployment_status, check_run, workflow_run
 */
export async function handleGitHubWebhook(req: Request, res: Response) {
  try {
    const event = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    console.log(`[GitHub Webhook] Event: ${event}, Delivery: ${deliveryId}`);

    // Get the raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // For now, we'll process without signature verification
    // In production, you'd verify against a stored webhook secret per connection
    // if (signature && webhookSecret) {
    //   if (!verifyGitHubSignature(rawBody, signature, webhookSecret)) {
    //     return res.status(401).json(errorResponse({ code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' }));
    //   }
    // }

    const payload = req.body;

    switch (event) {
      case 'push':
        await handleGitHubPush(payload);
        break;
      case 'deployment':
        await handleGitHubDeployment(payload);
        break;
      case 'deployment_status':
        await handleGitHubDeploymentStatus(payload);
        break;
      case 'check_run':
        await handleGitHubCheckRun(payload);
        break;
      case 'workflow_run':
        await handleGitHubWorkflowRun(payload);
        break;
      case 'ping':
        // GitHub sends a ping event when webhook is first configured
        return res.json(successResponse({ pong: true }, 'Webhook configured successfully'));
      default:
        console.log(`[GitHub Webhook] Unhandled event: ${event}`);
    }

    res.json(successResponse({ received: true, event }, 'Webhook processed'));
  } catch (error: any) {
    console.error('[GitHub Webhook] Error:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Handle GitHub push events
 */
async function handleGitHubPush(payload: any) {
  const { repository, ref, commits, pusher, head_commit } = payload;
  const branch = ref?.replace('refs/heads/', '');
  const repoFullName = repository?.full_name;

  console.log(`[GitHub Push] ${repoFullName}:${branch} - ${commits?.length || 0} commits`);

  // Find matching deployment sites
  const sites = await db.deploymentSite.findMany({
    where: {
      repoProvider: 'github',
      repoOwner: repository?.owner?.login,
      repoName: repository?.name,
    },
    include: {
      connection: true,
    },
  });

  for (const site of sites) {
    // Check if this branch matches the site's configured branch
    if (site.repoBranch && site.repoBranch !== branch) {
      continue;
    }

    // Create a deployment record for tracking
    const deployment = await db.deployment.create({
      data: {
        siteId: site.id,
        platformDeploymentId: `github-push-${head_commit?.id || Date.now()}`,
        status: 'QUEUED',
        environment: branch === 'main' || branch === 'master' ? 'PRODUCTION' : 'PREVIEW',
        gitCommitSha: head_commit?.id,
        gitCommitMessage: head_commit?.message,
        gitBranch: branch,
        gitAuthor: head_commit?.author?.name || pusher?.name,
        triggeredBy: 'webhook',
        triggeredByName: pusher?.name || 'GitHub',
        triggerType: 'push',
      },
    });

    // Create deployment event
    await db.deploymentEvent.create({
      data: {
        deploymentId: deployment.id,
        type: 'push_received',
        message: `Push received: ${commits?.length || 0} commit(s) to ${branch}`,
        metadata: {
          commits: commits?.slice(0, 5).map((c: any) => ({
            id: c.id,
            message: c.message,
            author: c.author?.name,
          })),
        },
      },
    });

    console.log(`[GitHub Push] Created deployment ${deployment.id} for site ${site.name}`);
  }
}

/**
 * Handle GitHub deployment events
 */
async function handleGitHubDeployment(payload: any) {
  const { deployment, repository, sender } = payload;
  
  console.log(`[GitHub Deployment] ${repository?.full_name} - Environment: ${deployment?.environment}`);

  const sites = await db.deploymentSite.findMany({
    where: {
      repoProvider: 'github',
      repoOwner: repository?.owner?.login,
      repoName: repository?.name,
    },
  });

  for (const site of sites) {
    // Check for existing deployment or create new one
    let existingDeployment = await db.deployment.findFirst({
      where: {
        siteId: site.id,
        platformDeploymentId: `github-deploy-${deployment?.id}`,
      },
    });

    if (!existingDeployment) {
      existingDeployment = await db.deployment.create({
        data: {
          siteId: site.id,
          platformDeploymentId: `github-deploy-${deployment?.id}`,
          status: 'QUEUED',
          environment: mapGitHubEnvironment(deployment?.environment),
          gitCommitSha: deployment?.sha,
          gitBranch: deployment?.ref,
          triggeredBy: 'webhook',
          triggeredByName: sender?.login || 'GitHub',
          triggerType: 'webhook',
        },
      });
    }

    await db.deploymentEvent.create({
      data: {
        deploymentId: existingDeployment.id,
        type: 'deployment_created',
        message: `Deployment created for environment: ${deployment?.environment}`,
        metadata: {
          githubDeploymentId: deployment?.id,
          environment: deployment?.environment,
          description: deployment?.description,
        },
      },
    });
  }
}

/**
 * Handle GitHub deployment status events
 */
async function handleGitHubDeploymentStatus(payload: any) {
  const { deployment_status, deployment, repository } = payload;
  
  console.log(`[GitHub Deployment Status] ${repository?.full_name} - Status: ${deployment_status?.state}`);

  const sites = await db.deploymentSite.findMany({
    where: {
      repoProvider: 'github',
      repoOwner: repository?.owner?.login,
      repoName: repository?.name,
    },
  });

  for (const site of sites) {
    const existingDeployment = await db.deployment.findFirst({
      where: {
        siteId: site.id,
        OR: [
          { platformDeploymentId: `github-deploy-${deployment?.id}` },
          { gitCommitSha: deployment?.sha },
        ],
      },
    });

    if (existingDeployment) {
      const newStatus = mapGitHubStatus(deployment_status?.state);
      
      await db.deployment.update({
        where: { id: existingDeployment.id },
        data: {
          status: newStatus,
          deploymentUrl: deployment_status?.environment_url || deployment_status?.target_url,
          ...(newStatus === 'READY' && { finishedAt: new Date() }),
          ...(newStatus === 'ERROR' && { 
            finishedAt: new Date(),
            errorMessage: deployment_status?.description,
          }),
        },
      });

      await db.deploymentEvent.create({
        data: {
          deploymentId: existingDeployment.id,
          type: `status_${deployment_status?.state}`,
          message: deployment_status?.description || `Status changed to ${deployment_status?.state}`,
          metadata: {
            state: deployment_status?.state,
            targetUrl: deployment_status?.target_url,
            environmentUrl: deployment_status?.environment_url,
          },
        },
      });
    }
  }
}

/**
 * Handle GitHub check run events (for GitHub Actions)
 */
async function handleGitHubCheckRun(payload: any) {
  const { check_run, repository } = payload;
  
  // Only process completed check runs
  if (check_run?.status !== 'completed') return;

  console.log(`[GitHub Check Run] ${repository?.full_name} - ${check_run?.name}: ${check_run?.conclusion}`);

  const sites = await db.deploymentSite.findMany({
    where: {
      repoProvider: 'github',
      repoOwner: repository?.owner?.login,
      repoName: repository?.name,
    },
  });

  for (const site of sites) {
    const existingDeployment = await db.deployment.findFirst({
      where: {
        siteId: site.id,
        gitCommitSha: check_run?.head_sha,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingDeployment) {
      await db.deploymentEvent.create({
        data: {
          deploymentId: existingDeployment.id,
          type: 'check_run_completed',
          message: `Check "${check_run?.name}" ${check_run?.conclusion}`,
          metadata: {
            checkRunId: check_run?.id,
            name: check_run?.name,
            conclusion: check_run?.conclusion,
            htmlUrl: check_run?.html_url,
          },
        },
      });
    }
  }
}

/**
 * Handle GitHub workflow run events
 */
async function handleGitHubWorkflowRun(payload: any) {
  const { workflow_run, repository } = payload;
  
  console.log(`[GitHub Workflow] ${repository?.full_name} - ${workflow_run?.name}: ${workflow_run?.status}`);

  const sites = await db.deploymentSite.findMany({
    where: {
      repoProvider: 'github',
      repoOwner: repository?.owner?.login,
      repoName: repository?.name,
    },
  });

  for (const site of sites) {
    const existingDeployment = await db.deployment.findFirst({
      where: {
        siteId: site.id,
        gitCommitSha: workflow_run?.head_sha,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingDeployment) {
      // Update deployment status based on workflow status
      if (workflow_run?.status === 'completed') {
        const newStatus = workflow_run?.conclusion === 'success' ? 'READY' : 'ERROR';
        
        await db.deployment.update({
          where: { id: existingDeployment.id },
          data: {
            status: newStatus,
            finishedAt: new Date(),
            ...(newStatus === 'ERROR' && { errorMessage: `Workflow failed: ${workflow_run?.conclusion}` }),
          },
        });
      } else if (workflow_run?.status === 'in_progress') {
        await db.deployment.update({
          where: { id: existingDeployment.id },
          data: {
            status: 'BUILDING',
            startedAt: existingDeployment.startedAt || new Date(),
          },
        });
      }

      await db.deploymentEvent.create({
        data: {
          deploymentId: existingDeployment.id,
          type: `workflow_${workflow_run?.status}`,
          message: `Workflow "${workflow_run?.name}" ${workflow_run?.status}${workflow_run?.conclusion ? `: ${workflow_run?.conclusion}` : ''}`,
          metadata: {
            workflowId: workflow_run?.id,
            name: workflow_run?.name,
            status: workflow_run?.status,
            conclusion: workflow_run?.conclusion,
            htmlUrl: workflow_run?.html_url,
          },
        },
      });
    }
  }
}

// ============================================================================
// VERCEL WEBHOOKS
// ============================================================================

/**
 * Handle Vercel webhook events
 */
export async function handleVercelWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    const eventType = payload?.type;

    console.log(`[Vercel Webhook] Event: ${eventType}`);

    switch (eventType) {
      case 'deployment.created':
        await handleVercelDeploymentCreated(payload);
        break;
      case 'deployment.succeeded':
        await handleVercelDeploymentSucceeded(payload);
        break;
      case 'deployment.error':
        await handleVercelDeploymentError(payload);
        break;
      case 'deployment.canceled':
        await handleVercelDeploymentCanceled(payload);
        break;
      default:
        console.log(`[Vercel Webhook] Unhandled event: ${eventType}`);
    }

    res.json(successResponse({ received: true, event: eventType }, 'Webhook processed'));
  } catch (error: any) {
    console.error('[Vercel Webhook] Error:', error);
    res.status(500).json(internalServerError(error));
  }
}

async function handleVercelDeploymentCreated(payload: any) {
  const { deployment, project } = payload;
  
  const site = await db.deploymentSite.findFirst({
    where: {
      platformSiteId: project?.id,
      connection: { platform: 'VERCEL' },
    },
  });

  if (!site) return;

  await db.deployment.create({
    data: {
      siteId: site.id,
      platformDeploymentId: deployment?.id,
      status: 'BUILDING',
      environment: deployment?.target === 'production' ? 'PRODUCTION' : 'PREVIEW',
      gitCommitSha: deployment?.meta?.githubCommitSha,
      gitCommitMessage: deployment?.meta?.githubCommitMessage,
      gitBranch: deployment?.meta?.githubCommitRef,
      gitAuthor: deployment?.meta?.githubCommitAuthorName,
      deploymentUrl: deployment?.url ? `https://${deployment.url}` : null,
      inspectUrl: deployment?.inspectorUrl,
      triggeredBy: 'webhook',
      triggeredByName: deployment?.creator?.username || 'Vercel',
      triggerType: 'webhook',
      startedAt: new Date(),
    },
  });
}

async function handleVercelDeploymentSucceeded(payload: any) {
  const { deployment, project } = payload;
  
  const existingDeployment = await db.deployment.findFirst({
    where: {
      platformDeploymentId: deployment?.id,
      site: {
        platformSiteId: project?.id,
        connection: { platform: 'VERCEL' },
      },
    },
  });

  if (existingDeployment) {
    await db.deployment.update({
      where: { id: existingDeployment.id },
      data: {
        status: 'READY',
        finishedAt: new Date(),
        deploymentUrl: deployment?.url ? `https://${deployment.url}` : existingDeployment.deploymentUrl,
      },
    });

    await db.deploymentEvent.create({
      data: {
        deploymentId: existingDeployment.id,
        type: 'deployment_succeeded',
        message: 'Deployment completed successfully',
      },
    });
  }
}

async function handleVercelDeploymentError(payload: any) {
  const { deployment, project } = payload;
  
  const existingDeployment = await db.deployment.findFirst({
    where: {
      platformDeploymentId: deployment?.id,
      site: {
        platformSiteId: project?.id,
        connection: { platform: 'VERCEL' },
      },
    },
  });

  if (existingDeployment) {
    await db.deployment.update({
      where: { id: existingDeployment.id },
      data: {
        status: 'ERROR',
        finishedAt: new Date(),
        errorMessage: deployment?.errorMessage || 'Deployment failed',
      },
    });

    await db.deploymentEvent.create({
      data: {
        deploymentId: existingDeployment.id,
        type: 'deployment_error',
        message: deployment?.errorMessage || 'Deployment failed',
      },
    });
  }
}

async function handleVercelDeploymentCanceled(payload: any) {
  const { deployment, project } = payload;
  
  const existingDeployment = await db.deployment.findFirst({
    where: {
      platformDeploymentId: deployment?.id,
      site: {
        platformSiteId: project?.id,
        connection: { platform: 'VERCEL' },
      },
    },
  });

  if (existingDeployment) {
    await db.deployment.update({
      where: { id: existingDeployment.id },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date(),
      },
    });
  }
}

// ============================================================================
// NETLIFY WEBHOOKS
// ============================================================================

/**
 * Handle Netlify webhook events
 */
export async function handleNetlifyWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    const eventType = req.headers['x-netlify-event'] as string;

    console.log(`[Netlify Webhook] Event: ${eventType}`);

    switch (eventType) {
      case 'deploy_building':
        await handleNetlifyDeployBuilding(payload);
        break;
      case 'deploy_created':
        await handleNetlifyDeployCreated(payload);
        break;
      case 'deploy_failed':
        await handleNetlifyDeployFailed(payload);
        break;
      default:
        console.log(`[Netlify Webhook] Unhandled event: ${eventType}`);
    }

    res.json(successResponse({ received: true, event: eventType }, 'Webhook processed'));
  } catch (error: any) {
    console.error('[Netlify Webhook] Error:', error);
    res.status(500).json(internalServerError(error));
  }
}

async function handleNetlifyDeployBuilding(payload: any) {
  const { id, site_id, branch, commit_ref, committer } = payload;
  
  const site = await db.deploymentSite.findFirst({
    where: {
      platformSiteId: site_id,
      connection: { platform: 'NETLIFY' },
    },
  });

  if (!site) return;

  await db.deployment.create({
    data: {
      siteId: site.id,
      platformDeploymentId: id,
      status: 'BUILDING',
      environment: branch === 'main' || branch === 'master' ? 'PRODUCTION' : 'PREVIEW',
      gitCommitSha: commit_ref,
      gitBranch: branch,
      gitAuthor: committer,
      triggeredBy: 'webhook',
      triggeredByName: committer || 'Netlify',
      triggerType: 'webhook',
      startedAt: new Date(),
    },
  });
}

async function handleNetlifyDeployCreated(payload: any) {
  const { id, site_id, ssl_url, deploy_time } = payload;
  
  const existingDeployment = await db.deployment.findFirst({
    where: {
      platformDeploymentId: id,
      site: {
        platformSiteId: site_id,
        connection: { platform: 'NETLIFY' },
      },
    },
  });

  if (existingDeployment) {
    await db.deployment.update({
      where: { id: existingDeployment.id },
      data: {
        status: 'READY',
        finishedAt: new Date(),
        deploymentUrl: ssl_url,
        buildDuration: deploy_time,
      },
    });
  }
}

async function handleNetlifyDeployFailed(payload: any) {
  const { id, site_id, error_message } = payload;
  
  const existingDeployment = await db.deployment.findFirst({
    where: {
      platformDeploymentId: id,
      site: {
        platformSiteId: site_id,
        connection: { platform: 'NETLIFY' },
      },
    },
  });

  if (existingDeployment) {
    await db.deployment.update({
      where: { id: existingDeployment.id },
      data: {
        status: 'ERROR',
        finishedAt: new Date(),
        errorMessage: error_message || 'Deployment failed',
      },
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapGitHubStatus(state: string): string {
  switch (state) {
    case 'success':
      return 'READY';
    case 'failure':
    case 'error':
      return 'ERROR';
    case 'pending':
      return 'QUEUED';
    case 'in_progress':
      return 'DEPLOYING';
    case 'queued':
      return 'QUEUED';
    default:
      return 'QUEUED';
  }
}

function mapGitHubEnvironment(env: string): string {
  const envLower = env?.toLowerCase() || '';
  if (envLower.includes('prod')) return 'PRODUCTION';
  if (envLower.includes('stag')) return 'STAGING';
  if (envLower.includes('dev')) return 'DEVELOPMENT';
  return 'PREVIEW';
}
