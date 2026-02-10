/**
 * Supercharged Mode — Action Executor
 *
 * Executes parsed intents by calling internal Prisma operations directly.
 * Each action is permission-checked and audited.
 */

import prisma from '../lib/prisma';
import { generateInviteCode } from '../utils/invite-codes';
import { PlatformIntegrationService } from './platform-integration.service';

const platformService = new PlatformIntegrationService();

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  redirectUrl?: string; // Frontend can navigate here after execution
  undoData?: Record<string, any>; // Snapshot needed to reverse the action
  canUndo?: boolean;
}

// ─── CreateProject ──────────────────────────────────────────────────────────

async function executeCreateProject(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { projectName, inviteEmail, inviteRole } = slots;

  if (!projectName) {
    return { success: false, message: 'Project name is required.' };
  }

  // Create the project
  const project = await prisma.project.create({
    data: {
      title: projectName,
      description: `Project created via Supercharged Mode`,
      userId,
      status: 'PLANNING',
      visibility: 'PRIVATE',
    },
  });

  let inviteResult = '';

  // Invite user if email provided
  if (inviteEmail) {
    const invitedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: inviteEmail },
          { username: inviteEmail },
        ],
      },
    });

    if (invitedUser) {
      const role = (['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(inviteRole))
        ? inviteRole
        : 'MEMBER';

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: invitedUser.id,
          role,
        },
      });
      inviteResult = ` Invited ${invitedUser.name || invitedUser.username} as ${role.toLowerCase()}.`;
    } else {
      inviteResult = ` Could not find user "${inviteEmail}" to invite.`;
    }
  }

  return {
    success: true,
    message: `Project "${projectName}" created successfully.${inviteResult}`,
    data: { projectId: project.id, projectTitle: project.title },
    redirectUrl: `/dashboard/projects/${project.id}`,
    canUndo: true,
    undoData: { action: 'deleteProject', projectId: project.id },
  };
}

// ─── OpenSession ────────────────────────────────────────────────────────────

async function executeOpenSession(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { sessionTitle, language, visibility, inviteUsers } = slots;

  const title = sessionTitle || 'New Session';
  const lang = language || 'TYPESCRIPT';
  const vis = visibility || 'PRIVATE';

  const session = await prisma.collaborativeSession.create({
    data: {
      title,
      ownerId: userId,
      language: lang,
      visibility: vis,
      inviteCode: vis !== 'PRIVATE' ? generateInviteCode() : null,
    },
    include: {
      owner: {
        select: { id: true, name: true, username: true },
      },
    },
  });

  let inviteResult = '';

  // Invite users if provided
  if (inviteUsers && inviteUsers.length > 0) {
    const invited: string[] = [];
    const notFound: string[] = [];

    for (const identifier of inviteUsers) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
          ],
        },
      });

      if (user && user.id !== userId) {
        await prisma.sessionPermission.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            role: 'EDITOR',
          },
        });
        invited.push(user.name || user.username);
      } else if (!user) {
        notFound.push(identifier);
      }
    }

    if (invited.length > 0) inviteResult += ` Invited ${invited.join(', ')}.`;
    if (notFound.length > 0) inviteResult += ` Could not find: ${notFound.join(', ')}.`;
  }

  return {
    success: true,
    message: `Session "${title}" created successfully.${inviteResult}`,
    data: { sessionId: session.id, sessionTitle: session.title },
    redirectUrl: `/dashboard/sessions/${session.id}`,
    canUndo: true,
    undoData: { action: 'deleteSession', sessionId: session.id },
  };
}

// ─── ChangeProfile ──────────────────────────────────────────────────────────

async function executeChangeProfile(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { profileFields } = slots;

  if (!profileFields || Object.keys(profileFields).length === 0) {
    return {
      success: false,
      message: 'No profile fields specified. Try "Change my name to John" or "Update my bio to Developer".',
    };
  }

  // Validate username uniqueness if changing username
  if (profileFields.username) {
    const existing = await prisma.user.findUnique({
      where: { username: profileFields.username },
    });
    if (existing && existing.id !== userId) {
      return {
        success: false,
        message: `Username "${profileFields.username}" is already taken.`,
      };
    }
  }

  const updateData: Record<string, any> = {};
  if (profileFields.name) updateData.name = profileFields.name;
  if (profileFields.bio) updateData.bio = profileFields.bio;
  if (profileFields.username) updateData.username = profileFields.username;
  if (profileFields.githubUrl) updateData.githubUrl = profileFields.githubUrl;
  if (profileFields.twitterUrl) updateData.twitterUrl = profileFields.twitterUrl;
  if (profileFields.portfolioUrl) updateData.portfolioUrl = profileFields.portfolioUrl;

  // Snapshot current values before updating (for undo)
  const previousValues = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true, bio: true, username: true,
      githubUrl: true, twitterUrl: true, portfolioUrl: true,
    },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, username: true, bio: true },
  });

  const changedFields = Object.keys(updateData).join(', ');

  // Build undo snapshot — only the fields that were changed
  const undoFields: Record<string, any> = {};
  for (const key of Object.keys(updateData)) {
    undoFields[key] = (previousValues as any)?.[key] ?? null;
  }

  return {
    success: true,
    message: `Profile updated: ${changedFields}.`,
    data: { user },
    redirectUrl: `/settings`,
    canUndo: true,
    undoData: { action: 'revertProfile', previousFields: undoFields },
  };
}

// ─── CreateRunbook ───────────────────────────────────────────────────────────

async function executeCreateRunbook(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { name, description, environment, tags } = slots;

  if (!name) {
    return { success: false, message: 'Runbook name is required.' };
  }

  const env = (['DEVELOPMENT', 'STAGING', 'PRODUCTION'].includes(environment))
    ? environment
    : 'DEVELOPMENT';

  const runbook = await prisma.runbook.create({
    data: {
      name,
      description: description || `Runbook created via Supercharged Mode`,
      ownerId: userId,
      status: 'DRAFT',
      environment: env,
      tags: Array.isArray(tags) ? tags : [],
      steps: [],
    },
  });

  return {
    success: true,
    message: `Runbook "${name}" created as a draft in ${env.toLowerCase()} environment.`,
    data: { runbookId: runbook.id, runbookName: runbook.name },
    redirectUrl: `/dashboard/runbooks/${runbook.id}`,
    canUndo: true,
    undoData: { action: 'deleteRunbook', runbookId: runbook.id },
  };
}

// ─── TriggerRunbook ──────────────────────────────────────────────────────────

async function executeTriggerRunbook(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { runbookId, runbookName, parameters } = slots;

  if (!runbookId) {
    return { success: false, message: 'Could not identify which runbook to run.' };
  }

  const runbook = await prisma.runbook.findUnique({
    where: { id: runbookId },
  });

  if (!runbook) {
    return { success: false, message: `Runbook "${runbookName || runbookId}" not found.` };
  }

  if (runbook.ownerId !== userId) {
    return { success: false, message: 'You do not have permission to run this runbook.' };
  }

  if (runbook.status === 'ARCHIVED') {
    return { success: false, message: `Runbook is archived and cannot be executed.` };
  }

  // Create an execution record
  const execution = await prisma.runbookExecution.create({
    data: {
      runbookId: runbook.id,
      triggeredBy: userId,
      status: 'QUEUED',
      environment: runbook.environment,
      inputParams: parameters || {},
    },
  });

  return {
    success: true,
    message: `Runbook "${runbook.name}" triggered. Execution ID: ${execution.id}`,
    data: { executionId: execution.id, runbookId: runbook.id },
    redirectUrl: `/dashboard/runbooks/executions/${execution.id}`,
  };
}

// ─── Deploy ──────────────────────────────────────────────────────────────────

async function executeDeploy(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { siteId, siteName, environment, branch } = slots;

  if (!siteId) {
    return { success: false, message: 'Could not identify which site to deploy. Try specifying the site name.' };
  }

  // Find the site and verify ownership
  const site = await (prisma as any).deploymentSite.findFirst({
    where: {
      id: siteId,
      connection: { userId },
    },
    include: {
      connection: { select: { platform: true, platformName: true } },
      deployments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { status: true, environment: true, createdAt: true, finishedAt: true },
      },
    },
  });

  if (!site) {
    return { success: false, message: `Site "${siteName || siteId}" not found or you don't have access.` };
  }

  // ── AI Risk Scoring ──────────────────────────────────────────────────
  const env = environment || 'PREVIEW';
  const riskFactors: string[] = [];
  let riskScore = 0;

  // Factor 1: Production deployments are inherently riskier
  if (env === 'PRODUCTION') {
    riskScore += 30;
    riskFactors.push('Production environment deployment');
  } else if (env === 'STAGING') {
    riskScore += 15;
    riskFactors.push('Staging environment deployment');
  }

  // Factor 2: Time-based risk (deploying outside business hours or on weekends)
  const now = new Date();
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) {
    riskScore += 15;
    riskFactors.push('Weekend deployment');
  }
  if (hour < 6 || hour > 22) {
    riskScore += 10;
    riskFactors.push('Off-hours deployment');
  }

  // Factor 3: Recent failures
  const recentDeployments = site.deployments || [];
  const recentFailures = recentDeployments.filter((d: any) => d.status === 'FAILED');
  if (recentFailures.length >= 2) {
    riskScore += 25;
    riskFactors.push(`${recentFailures.length} recent deployment failures`);
  } else if (recentFailures.length === 1) {
    riskScore += 10;
    riskFactors.push('1 recent deployment failure');
  }

  // Factor 4: Rapid successive deployments
  const lastDeploy = recentDeployments[0];
  if (lastDeploy) {
    const timeSinceLast = now.getTime() - new Date(lastDeploy.createdAt).getTime();
    if (timeSinceLast < 5 * 60 * 1000) { // Less than 5 minutes
      riskScore += 15;
      riskFactors.push('Deploying within 5 minutes of last deployment');
    }
  }

  riskScore = Math.min(riskScore, 100);

  // Block high-risk production deployments
  if (env === 'PRODUCTION' && riskScore >= 70) {
    return {
      success: false,
      message: `⚠️ Deployment blocked — risk score is ${riskScore}/100.\nRisk factors:\n${riskFactors.map(f => `• ${f}`).join('\n')}\n\nConsider deploying to staging first or addressing the risk factors.`,
      data: { riskScore, riskFactors },
    };
  }

  // Trigger the deployment
  const deployResult = await platformService.triggerDeployment(siteId, {
    branch: branch || site.repoBranch || 'main',
    environment: env.toLowerCase(),
  });

  if (!deployResult.success) {
    return {
      success: false,
      message: `Deployment failed: ${deployResult.error || 'Unknown error'}`,
      data: { riskScore, riskFactors },
    };
  }

  // Create deployment record with risk data
  const deployment = await (prisma as any).deployment.create({
    data: {
      siteId: site.id,
      platformDeploymentId: deployResult.platformDeploymentId || `sc-${Date.now()}`,
      status: 'QUEUED',
      environment: env,
      gitBranch: branch || site.repoBranch || 'main',
      triggerType: 'manual',
      triggeredBy: userId,
      riskScore,
      riskFactors: riskFactors,
      aiSummary: riskScore > 40
        ? `Medium-risk deployment to ${env.toLowerCase()}. ${riskFactors.join('. ')}.`
        : `Low-risk deployment to ${env.toLowerCase()}.`,
    },
  });

  const riskLabel = riskScore >= 50 ? '⚠️ Medium risk' : '✅ Low risk';

  return {
    success: true,
    message: `Deployment triggered for "${site.name}" to ${env.toLowerCase()} (${site.connection.platform}).\n${riskLabel} (score: ${riskScore}/100)${riskFactors.length > 0 ? `\nFactors: ${riskFactors.join(', ')}` : ''}`,
    data: {
      deploymentId: deployment.id,
      siteId: site.id,
      siteName: site.name,
      riskScore,
      riskFactors,
    },
    redirectUrl: `/dashboard/deployments`,
    canUndo: false, // Deployments can't be trivially undone
  };
}

// ─── Navigate ────────────────────────────────────────────────────────────────

async function executeNavigate(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { route } = slots;

  if (!route || typeof route !== 'string') {
    return { success: false, message: 'No destination specified.' };
  }

  // Validate the route is a known dashboard path
  const validPrefixes = ['/dashboard', '/settings'];
  const isValid = validPrefixes.some((p) => route.startsWith(p));

  if (!isValid) {
    return { success: false, message: `"${route}" is not a valid page.` };
  }

  return {
    success: true,
    message: `Navigating to ${route}`,
    redirectUrl: route,
  };
}

// ─── RunMacro ────────────────────────────────────────────────────────────────

async function executeRunMacro(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const { macroId, macroName } = slots;

  if (!macroId) {
    return { success: false, message: 'Could not identify which macro to run. Try specifying the macro name.' };
  }

  const macro = await prisma.superchargedMacro.findFirst({
    where: { id: macroId, userId },
  });

  if (!macro) {
    return { success: false, message: `Macro "${macroName || macroId}" not found.` };
  }

  const steps = macro.steps as Array<{ intent: string; slots: Record<string, any>; description: string }>;
  if (!Array.isArray(steps) || steps.length === 0) {
    return { success: false, message: `Macro "${macro.name}" has no steps defined.` };
  }

  const results: any[] = [];
  let prevData: Record<string, any> = {};
  let allSuccess = true;

  for (const step of steps) {
    // Resolve placeholders from previous step results
    let resolvedSlots = JSON.parse(JSON.stringify(step.slots || {}));
    const slotsStr = JSON.stringify(resolvedSlots);
    if (slotsStr.includes('__PREV_')) {
      const replaced = slotsStr
        .replace(/__PREV_PROJECT_ID__/g, prevData.projectId || '')
        .replace(/__PREV_SESSION_ID__/g, prevData.sessionId || '')
        .replace(/__PREV_RUNBOOK_ID__/g, prevData.runbookId || '');
      resolvedSlots = JSON.parse(replaced);
    }

    // Use the exported executeIntent to run each step
    const stepResult = await executeIntent(step.intent, userId, resolvedSlots);
    results.push({ intent: step.intent, description: step.description, ...stepResult });

    if (!stepResult.success) {
      allSuccess = false;
      break;
    }

    if (stepResult.data) {
      prevData = { ...prevData, ...stepResult.data };
    }
  }

  // Update macro usage stats
  await prisma.superchargedMacro.update({
    where: { id: macro.id },
    data: { runCount: { increment: 1 }, lastRunAt: new Date() },
  });

  const combinedMessage = results.map((r, i) => `${i + 1}. ${r.message}`).join('\n');
  const lastResult = results[results.length - 1];

  return {
    success: allSuccess,
    message: `Macro "${macro.name}" ${allSuccess ? 'completed' : 'failed'}:\n${combinedMessage}`,
    data: { macroId: macro.id, macroName: macro.name, stepResults: results },
    redirectUrl: lastResult?.redirectUrl,
  };
}

// ─── Conversational ──────────────────────────────────────────────────────────

async function executeConversational(
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  return {
    success: true,
    message: slots.response || slots.description || 'How can I help you?',
  };
}

// ─── Main executor ──────────────────────────────────────────────────────────

const EXECUTORS: Record<string, (userId: string, slots: Record<string, any>) => Promise<ExecutionResult>> = {
  CreateProject: executeCreateProject,
  OpenSession: executeOpenSession,
  ChangeProfile: executeChangeProfile,
  CreateRunbook: executeCreateRunbook,
  TriggerRunbook: executeTriggerRunbook,
  Deploy: executeDeploy,
  RunMacro: executeRunMacro,
  Navigate: executeNavigate,
  Conversational: executeConversational,
};

export async function executeIntent(
  intent: string,
  userId: string,
  slots: Record<string, any>,
): Promise<ExecutionResult> {
  const executor = EXECUTORS[intent];
  if (!executor) {
    return {
      success: false,
      message: `Unknown action: "${intent}". I can help you create projects, open sessions, or update your profile.`,
    };
  }

  try {
    return await executor(userId, slots);
  } catch (error: any) {
    console.error(`Supercharged executor error [${intent}]:`, error);
    return {
      success: false,
      message: `Something went wrong while executing: ${error.message || 'Unknown error'}`,
    };
  }
}

// ─── Undo executor ──────────────────────────────────────────────────────────

export async function undoCommand(
  userId: string,
  undoData: Record<string, any>,
): Promise<ExecutionResult> {
  try {
    switch (undoData.action) {
      case 'deleteProject': {
        const project = await prisma.project.findUnique({
          where: { id: undoData.projectId },
        });
        if (!project || project.userId !== userId) {
          return { success: false, message: 'Project not found or access denied.' };
        }
        await prisma.project.delete({ where: { id: undoData.projectId } });
        return { success: true, message: `Project "${project.title}" deleted (undo).` };
      }

      case 'deleteSession': {
        const session = await prisma.collaborativeSession.findUnique({
          where: { id: undoData.sessionId },
        });
        if (!session || session.ownerId !== userId) {
          return { success: false, message: 'Session not found or access denied.' };
        }
        await prisma.collaborativeSession.delete({ where: { id: undoData.sessionId } });
        return { success: true, message: `Session "${session.title}" deleted (undo).` };
      }

      case 'deleteRunbook': {
        const runbook = await prisma.runbook.findUnique({
          where: { id: undoData.runbookId },
        });
        if (!runbook || runbook.ownerId !== userId) {
          return { success: false, message: 'Runbook not found or access denied.' };
        }
        await prisma.runbook.delete({ where: { id: undoData.runbookId } });
        return { success: true, message: `Runbook "${runbook.name}" deleted (undo).` };
      }

      case 'revertProfile': {
        await prisma.user.update({
          where: { id: userId },
          data: undoData.previousFields,
        });
        const fields = Object.keys(undoData.previousFields).join(', ');
        return { success: true, message: `Profile reverted: ${fields}.` };
      }

      default:
        return { success: false, message: 'This action cannot be undone.' };
    }
  } catch (error: any) {
    console.error('Undo error:', error);
    return { success: false, message: `Undo failed: ${error.message || 'Unknown error'}` };
  }
}
