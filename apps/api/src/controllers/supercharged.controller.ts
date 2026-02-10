/**
 * Supercharged Mode — Controller
 *
 * Endpoints:
 *   POST /api/supercharged/parse     — Parse input, return intent + confirmation prompt
 *   POST /api/supercharged/execute   — Confirm & execute a parsed command
 *   GET  /api/supercharged/history   — Get command history for the user
 *   GET  /api/supercharged/suggestions — Get autocomplete suggestions
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { parseIntent, getSuggestions } from '../services/supercharged-intent.service';
import { executeIntent, undoCommand } from '../services/supercharged-executor.service';
import { websocketLogsService } from '../services/websocket-logs.service';

// ─── Parse user input → return intent + confirmation ────────────────────────

export const parseCommand = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { input, conversationHistory } = req.body;
    if (!input || typeof input !== 'string' || !input.trim()) {
      return res.status(400).json({ success: false, message: 'Input is required' });
    }

    // Validate conversation history format (optional, array of {role, content})
    const validHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((t: any) => t && ['user', 'assistant'].includes(t.role) && typeof t.content === 'string')
          .slice(-6)
      : undefined;

    // Fetch user context for LLM grounding
    const [recentProjects, recentSessions, userProfile, recentRunbooks, deploymentSites, aiMemories, userMacros] = await Promise.all([
      prisma.project.findMany({
        where: { OR: [{ userId }, { members: { some: { userId } } }] },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, title: true, status: true, createdAt: true,
          visibility: true,
          _count: { select: { members: true } },
          members: { select: { user: { select: { name: true, username: true } } }, take: 5 },
        },
      }),
      prisma.collaborativeSession.findMany({
        where: { OR: [{ ownerId: userId }, { permissions: { some: { userId } } }] },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, title: true, language: true, createdAt: true,
          _count: { select: { permissions: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true, bio: true },
      }),
      prisma.runbook.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, name: true, status: true, environment: true,
          tags: true, createdAt: true,
        },
      }),
      (prisma as any).deploymentSite.findMany({
        where: { connection: { userId } },
        orderBy: { lastDeployAt: 'desc' },
        take: 10,
        select: {
          id: true, name: true, framework: true, productionUrl: true,
          repoBranch: true, lastDeployAt: true,
          connection: { select: { platform: true } },
        },
      }),
      prisma.superchargedMemory.findMany({
        where: { userId },
        orderBy: { usageCount: 'desc' },
        take: 20,
        select: { category: true, key: true, value: true },
      }),
      prisma.superchargedMacro.findMany({
        where: { userId },
        orderBy: { runCount: 'desc' },
        take: 10,
        select: { id: true, name: true, description: true, trigger: true, runCount: true },
      }),
    ]);

    const userContext = [
      userProfile ? `User: ${userProfile.name || userProfile.username} (@${userProfile.username})${userProfile.bio ? ` — ${userProfile.bio}` : ''}` : null,
      recentProjects.length > 0
        ? `Recent projects (newest first):\n${recentProjects.map((p: any, i: number) => {
            const memberNames = p.members?.map((m: any) => m.user?.name || m.user?.username).filter(Boolean).join(', ');
            const memberCount = (p._count?.members || 0) + 1; // +1 for owner
            return `  ${i + 1}. "${p.title}" (id: ${p.id}, status: ${p.status}, visibility: ${p.visibility}, members: ${memberCount}${memberNames ? ` [${memberNames}]` : ''}, created: ${p.createdAt.toISOString().split('T')[0]})`;
          }).join('\n')}`
        : 'No projects yet.',
      recentSessions.length > 0
        ? `Recent sessions (newest first):\n${recentSessions.map((s: any, i: number) => {
            const participantCount = (s._count?.permissions || 0) + 1; // +1 for owner
            return `  ${i + 1}. "${s.title}" (id: ${s.id}, language: ${s.language}, participants: ${participantCount}, created: ${s.createdAt.toISOString().split('T')[0]})`;
          }).join('\n')}`
        : 'No sessions yet.',
      recentRunbooks.length > 0
        ? `Runbooks (newest first):\n${recentRunbooks.map((r: any, i: number) => {
            return `  ${i + 1}. "${r.name}" (id: ${r.id}, status: ${r.status}, env: ${r.environment}, tags: [${r.tags?.join(', ') || ''}], created: ${r.createdAt.toISOString().split('T')[0]})`;
          }).join('\n')}`
        : 'No runbooks yet.',
      deploymentSites.length > 0
        ? `Deployment sites:\n${deploymentSites.map((s: any, i: number) => {
            return `  ${i + 1}. "${s.name}" (id: ${s.id}, platform: ${s.connection?.platform}, framework: ${s.framework || 'unknown'}, branch: ${s.repoBranch || 'main'}${s.productionUrl ? `, url: ${s.productionUrl}` : ''}${s.lastDeployAt ? `, last deploy: ${new Date(s.lastDeployAt).toISOString().split('T')[0]}` : ''})`;
          }).join('\n')}`
        : 'No deployment sites connected.',
      aiMemories.length > 0
        ? `User preferences & memory:\n${aiMemories.map((m: any) => `  - [${m.category}] ${m.key}: ${m.value}`).join('\n')}`
        : null,
      userMacros.length > 0
        ? `Saved macros:\n${userMacros.map((m: any) => {
            return `  - "${m.name}" (id: ${m.id}${m.trigger ? `, trigger: "${m.trigger}"` : ''}${m.description ? `, ${m.description}` : ''}, runs: ${m.runCount})`;
          }).join('\n')}`
        : null,
    ].filter(Boolean).join('\n\n');

    const parsed = await parseIntent(input.trim(), userContext, validHistory);

    // For Navigate and Conversational intents, auto-execute immediately (no confirmation needed)
    const isAutoExecute = ['Navigate', 'Conversational'].includes(parsed.intent) && !parsed.requiresConfirmation;

    // Create audit record (with LLM audit data if LLM was used)
    const command = await prisma.superchargedCommand.create({
      data: {
        userId,
        rawInput: input.trim(),
        intent: parsed.intent,
        confidence: parsed.confidence,
        slots: {
          ...parsed.slots,
          ...(parsed.chain ? { __chain: parsed.chain.map(c => ({ intent: c.intent, slots: c.slots, description: c.description })) } : {}),
        } as any,
        status: isAutoExecute ? 'CONFIRMED' : (parsed.intent === 'Unknown' ? 'CANCELLED' : 'PENDING'),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        // LLM audit fields
        ...(parsed.llmAudit ? {
          llmPrompt: parsed.llmAudit.prompt as any,
          llmResponse: parsed.llmAudit.response,
          tokensUsed: parsed.llmAudit.tokensUsed,
          modelUsed: parsed.llmAudit.model,
        } : {}),
      },
    });

    // Auto-execute Navigate/Conversational intents
    if (isAutoExecute) {
      const result = await executeIntent(parsed.intent, userId, parsed.slots);

      await prisma.superchargedCommand.update({
        where: { id: command.id },
        data: {
          status: result.success ? 'EXECUTED' : 'FAILED',
          actionType: `action:${parsed.intent}`,
          result: result as any,
          errorMessage: result.success ? null : result.message,
          executedAt: new Date(),
          ...(result.undoData ? { undoData: result.undoData as any } : {}),
        },
      });

      return res.json({
        success: true,
        data: {
          commandId: command.id,
          intent: parsed.intent,
          confidence: parsed.confidence,
          slots: parsed.slots,
          description: parsed.description,
          requiresConfirmation: false,
          autoExecuted: true,
          result: { ...result, undoData: undefined },
          canUndo: result.canUndo || false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        commandId: command.id,
        intent: parsed.intent,
        confidence: parsed.confidence,
        slots: parsed.slots,
        description: parsed.description,
        requiresConfirmation: parsed.requiresConfirmation,
        ...(parsed.chain ? { isChained: true, chainSteps: parsed.chain.length } : {}),
      },
    });
  } catch (error: any) {
    console.error('Supercharged parse error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Execute a confirmed command ────────────────────────────────────────────

export const executeCommand = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { commandId } = req.body;
    if (!commandId) {
      return res.status(400).json({ success: false, message: 'commandId is required' });
    }

    // Find the pending command
    const command = await prisma.superchargedCommand.findUnique({
      where: { id: commandId },
    });

    if (!command) {
      return res.status(404).json({ success: false, message: 'Command not found' });
    }

    if (command.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (command.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Command is already ${command.status.toLowerCase()}`,
      });
    }

    // Mark as confirmed
    await prisma.superchargedCommand.update({
      where: { id: commandId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    const slots = (command.slots as Record<string, any>) || {};
    const chain = slots.__chain as Array<{ intent: string; slots: Record<string, any>; description: string }> | undefined;

    // ── Chained execution (with real-time progress streaming) ─────────
    if (chain && chain.length > 1) {
      const chainResults: any[] = [];
      let prevData: Record<string, any> = {};
      let allSuccess = true;

      // Emit initial progress
      websocketLogsService.emitCommandProgress(commandId, {
        percent: 0,
        message: `Starting ${chain.length}-step command chain...`,
        status: 'running',
      });

      for (let stepIdx = 0; stepIdx < chain.length; stepIdx++) {
        const step = chain[stepIdx];

        // Emit step starting
        websocketLogsService.emitCommandStepUpdate(commandId, {
          stepIndex: stepIdx,
          totalSteps: chain.length,
          intent: step.intent,
          description: step.description,
          status: 'running',
        });

        // Resolve placeholders from previous step results
        let resolvedSlots = JSON.parse(JSON.stringify(step.slots));
        const slotsStr = JSON.stringify(resolvedSlots);
        if (slotsStr.includes('__PREV_')) {
          const replaced = slotsStr
            .replace(/__PREV_PROJECT_ID__/g, prevData.projectId || '')
            .replace(/__PREV_SESSION_ID__/g, prevData.sessionId || '')
            .replace(/__PREV_RUNBOOK_ID__/g, prevData.runbookId || '');
          resolvedSlots = JSON.parse(replaced);
        }

        const stepResult = await executeIntent(step.intent, userId, resolvedSlots);
        chainResults.push({ intent: step.intent, description: step.description, ...stepResult });

        // Emit step result
        websocketLogsService.emitCommandStepUpdate(commandId, {
          stepIndex: stepIdx,
          totalSteps: chain.length,
          intent: step.intent,
          description: step.description,
          status: stepResult.success ? 'completed' : 'failed',
          result: stepResult.success ? stepResult.message : undefined,
          error: stepResult.success ? undefined : stepResult.message,
        });

        // Emit overall progress
        const percent = Math.round(((stepIdx + 1) / chain.length) * 100);
        websocketLogsService.emitCommandProgress(commandId, {
          percent,
          message: stepResult.success
            ? `Step ${stepIdx + 1}/${chain.length} completed: ${step.description}`
            : `Step ${stepIdx + 1}/${chain.length} failed: ${stepResult.message}`,
          status: 'running',
        });

        if (!stepResult.success) {
          allSuccess = false;
          break;
        }

        // Carry forward data for placeholder resolution
        if (stepResult.data) {
          prevData = { ...prevData, ...stepResult.data };
        }
      }

      // Emit final progress
      websocketLogsService.emitCommandProgress(commandId, {
        percent: 100,
        message: allSuccess ? 'All steps completed successfully' : 'Chain execution failed',
        status: allSuccess ? 'completed' : 'failed',
      });

      const combinedMessage = chainResults.map((r, i) => `${i + 1}. ${r.message}`).join('\n');
      const lastResult = chainResults[chainResults.length - 1];

      await prisma.superchargedCommand.update({
        where: { id: commandId },
        data: {
          status: allSuccess ? 'EXECUTED' : 'FAILED',
          actionType: `chain:${chain.map(s => s.intent).join('+')}`,
          result: { chainResults } as any,
          errorMessage: allSuccess ? null : lastResult?.message,
          executedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        data: {
          commandId,
          success: allSuccess,
          message: combinedMessage,
          redirectUrl: lastResult?.redirectUrl,
          data: prevData,
          isChained: true,
          chainResults,
          canUndo: false, // Chained commands don't support undo for simplicity
        },
      });
    }

    // ── Single command execution ───────────────────────────────────────
    const result = await executeIntent(
      command.intent,
      userId,
      slots,
    );

    // Update with result and undo data
    await prisma.superchargedCommand.update({
      where: { id: commandId },
      data: {
        status: result.success ? 'EXECUTED' : 'FAILED',
        actionType: `action:${command.intent}`,
        result: result as any,
        errorMessage: result.success ? null : result.message,
        executedAt: new Date(),
        ...(result.undoData ? { undoData: result.undoData as any } : {}),
      },
    });

    // ── Auto-learn user patterns (non-blocking) ─────────────────────
    if (result.success) {
      learnFromCommand(userId, command.intent, slots).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        commandId,
        ...result,
        undoData: undefined, // Don't expose undo internals to frontend
        canUndo: result.canUndo || false,
      },
    });
  } catch (error: any) {
    console.error('Supercharged execute error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Undo an executed command ────────────────────────────────────────────────

export const undoExecutedCommand = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { commandId } = req.body;
    if (!commandId) {
      return res.status(400).json({ success: false, message: 'commandId is required' });
    }

    const command = await prisma.superchargedCommand.findUnique({
      where: { id: commandId },
    });

    if (!command || command.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Command not found' });
    }

    if (command.status !== 'EXECUTED') {
      return res.status(400).json({ success: false, message: 'Only executed commands can be undone.' });
    }

    if (command.undoneAt) {
      return res.status(400).json({ success: false, message: 'This command has already been undone.' });
    }

    if (!command.undoData) {
      return res.status(400).json({ success: false, message: 'This command cannot be undone.' });
    }

    const result = await undoCommand(userId, command.undoData as Record<string, any>);

    if (result.success) {
      await prisma.superchargedCommand.update({
        where: { id: commandId },
        data: {
          undoneAt: new Date(),
          undoneById: userId,
        },
      });
    }

    res.json({
      success: true,
      data: { commandId, ...result },
    });
  } catch (error: any) {
    console.error('Supercharged undo error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Cancel a pending command ───────────────────────────────────────────────

export const cancelCommand = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { commandId } = req.body;
    if (!commandId) {
      return res.status(400).json({ success: false, message: 'commandId is required' });
    }

    const command = await prisma.superchargedCommand.findUnique({
      where: { id: commandId },
    });

    if (!command || command.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Command not found' });
    }

    if (command.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Command is not pending' });
    }

    await prisma.superchargedCommand.update({
      where: { id: commandId },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, message: 'Command cancelled' });
  } catch (error: any) {
    console.error('Supercharged cancel error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get command history ────────────────────────────────────────────────────

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const whereClause: any = { userId };
    if (cursor) {
      whereClause.createdAt = { lt: new Date(cursor) };
    }

    const commands = await prisma.superchargedCommand.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: {
        commands,
        hasMore: commands.length === limit,
      },
    });
  } catch (error: any) {
    console.error('Supercharged history error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get token usage stats ───────────────────────────────────────────────────

export const getTokenUsage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalStats, todayStats] = await Promise.all([
      prisma.superchargedCommand.aggregate({
        where: { userId, tokensUsed: { not: null } },
        _sum: { tokensUsed: true },
        _count: { id: true },
      }),
      prisma.superchargedCommand.aggregate({
        where: {
          userId,
          tokensUsed: { not: null },
          createdAt: { gte: todayStart },
        },
        _sum: { tokensUsed: true },
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalTokens: totalStats._sum.tokensUsed || 0,
        totalCommands: totalStats._count.id || 0,
        todayTokens: todayStats._sum.tokensUsed || 0,
        todayCommands: todayStats._count.id || 0,
      },
    });
  } catch (error: any) {
    console.error('Supercharged token usage error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get autocomplete suggestions ───────────────────────────────────────────

// ─── Personalized AI Memory ─────────────────────────────────────────────────

async function learnFromCommand(userId: string, intent: string, slots: Record<string, any>) {
  const memories: { category: string; key: string; value: string }[] = [];

  // Learn preferred session language
  if (intent === 'OpenSession' && slots.language) {
    memories.push({ category: 'preference', key: 'preferred_language', value: slots.language });
  }

  // Learn preferred deploy environment
  if (intent === 'Deploy' && slots.environment) {
    memories.push({ category: 'preference', key: 'preferred_deploy_env', value: slots.environment });
  }

  // Learn preferred session visibility
  if (intent === 'OpenSession' && slots.visibility) {
    memories.push({ category: 'preference', key: 'preferred_visibility', value: slots.visibility });
  }

  // Track frequently used intents
  memories.push({ category: 'pattern', key: `freq_intent_${intent}`, value: intent });

  for (const mem of memories) {
    await prisma.superchargedMemory.upsert({
      where: {
        userId_category_key: { userId, category: mem.category, key: mem.key },
      },
      create: { userId, category: mem.category, key: mem.key, value: mem.value, source: 'auto' },
      update: { value: mem.value, usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });
  }
}

export const getMemories = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const memories = await prisma.superchargedMemory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, category: true, key: true, value: true, source: true, usageCount: true, createdAt: true },
    });

    res.json({ success: true, data: { memories } });
  } catch (error: any) {
    console.error('Supercharged memories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const saveMemory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { category, key, value } = req.body;
    if (!category || !key || !value) {
      return res.status(400).json({ success: false, message: 'category, key, and value are required' });
    }

    const memory = await prisma.superchargedMemory.upsert({
      where: { userId_category_key: { userId, category, key } },
      create: { userId, category, key, value, source: 'explicit' },
      update: { value, source: 'explicit', usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    res.json({ success: true, data: { memory } });
  } catch (error: any) {
    console.error('Supercharged save memory error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteMemory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { memoryId } = req.body;
    if (!memoryId) {
      return res.status(400).json({ success: false, message: 'memoryId is required' });
    }

    const memory = await prisma.superchargedMemory.findUnique({ where: { id: memoryId } });
    if (!memory || memory.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Memory not found' });
    }

    await prisma.superchargedMemory.delete({ where: { id: memoryId } });
    res.json({ success: true, message: 'Memory deleted' });
  } catch (error: any) {
    console.error('Supercharged delete memory error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Autonomous Orchestrators ────────────────────────────────────────────────

export const getOrchestrators = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orchestrators = await prisma.superchargedOrchestrator.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: { orchestrators } });
  } catch (error: any) {
    console.error('Supercharged orchestrators error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createOrchestrator = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, description, triggerEvent, triggerConditions, actionIntent, actionSlots } = req.body;
    if (!name || !triggerEvent || !actionIntent || !actionSlots) {
      return res.status(400).json({ success: false, message: 'name, triggerEvent, actionIntent, and actionSlots are required' });
    }

    const orchestrator = await prisma.superchargedOrchestrator.create({
      data: { userId, name, description, triggerEvent, triggerConditions, actionIntent, actionSlots },
    });

    res.json({ success: true, data: { orchestrator } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: `An orchestrator named "${req.body.name}" already exists` });
    }
    console.error('Supercharged create orchestrator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateOrchestrator = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { orchestratorId, ...updates } = req.body;
    if (!orchestratorId) return res.status(400).json({ success: false, message: 'orchestratorId is required' });

    const existing = await prisma.superchargedOrchestrator.findUnique({ where: { id: orchestratorId } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Orchestrator not found' });
    }

    const allowedFields = ['name', 'description', 'triggerEvent', 'triggerConditions', 'actionIntent', 'actionSlots', 'isActive'];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) data[field] = updates[field];
    }

    const orchestrator = await prisma.superchargedOrchestrator.update({
      where: { id: orchestratorId },
      data,
    });

    res.json({ success: true, data: { orchestrator } });
  } catch (error: any) {
    console.error('Supercharged update orchestrator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteOrchestrator = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { orchestratorId } = req.body;
    if (!orchestratorId) return res.status(400).json({ success: false, message: 'orchestratorId is required' });

    const orch = await prisma.superchargedOrchestrator.findUnique({ where: { id: orchestratorId } });
    if (!orch || orch.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Orchestrator not found' });
    }

    await prisma.superchargedOrchestrator.delete({ where: { id: orchestratorId } });
    res.json({ success: true, message: `Orchestrator "${orch.name}" deleted` });
  } catch (error: any) {
    console.error('Supercharged delete orchestrator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Workspace Automation Macros ─────────────────────────────────────────────

export const getMacros = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Get user's own macros
    const ownMacros = await prisma.superchargedMacro.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, description: true, steps: true, trigger: true,
        runCount: true, lastRunAt: true, createdAt: true, isShared: true, projectId: true,
        project: { select: { id: true, title: true } },
      },
    });

    // Get team shared macros from projects the user belongs to
    const teamMacros = await prisma.superchargedMacro.findMany({
      where: {
        isShared: true,
        userId: { not: userId },
        project: {
          OR: [
            { userId },
            { members: { some: { userId } } },
          ],
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, description: true, steps: true, trigger: true,
        runCount: true, lastRunAt: true, createdAt: true, isShared: true, projectId: true,
        project: { select: { id: true, title: true } },
        user: { select: { name: true, username: true } },
      },
    });

    res.json({ success: true, data: { macros: ownMacros, teamMacros } });
  } catch (error: any) {
    console.error('Supercharged macros error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createMacro = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, description, steps, trigger, projectId, isShared } = req.body;
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ success: false, message: 'name and steps (non-empty array) are required' });
    }

    // Validate step structure
    for (const step of steps) {
      if (!step.intent) {
        return res.status(400).json({ success: false, message: 'Each step must have an intent' });
      }
    }

    // Verify project access if sharing to a team
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const hasAccess = project.userId === userId || project.members.some(m => m.userId === userId);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }

    const macro = await prisma.superchargedMacro.create({
      data: { userId, name, description, steps, trigger, projectId: projectId || null, isShared: isShared || false },
    });

    res.json({ success: true, data: { macro } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: `A macro named "${req.body.name}" already exists` });
    }
    console.error('Supercharged create macro error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateMacro = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { macroId, name, description, steps, trigger } = req.body;
    if (!macroId) return res.status(400).json({ success: false, message: 'macroId is required' });

    const existing = await prisma.superchargedMacro.findUnique({ where: { id: macroId } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Macro not found' });
    }

    const macro = await prisma.superchargedMacro.update({
      where: { id: macroId },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(steps ? { steps } : {}),
        ...(trigger !== undefined ? { trigger } : {}),
      },
    });

    res.json({ success: true, data: { macro } });
  } catch (error: any) {
    console.error('Supercharged update macro error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteMacro = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { macroId } = req.body;
    if (!macroId) return res.status(400).json({ success: false, message: 'macroId is required' });

    const macro = await prisma.superchargedMacro.findUnique({ where: { id: macroId } });
    if (!macro || macro.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Macro not found' });
    }

    await prisma.superchargedMacro.delete({ where: { id: macroId } });
    res.json({ success: true, message: `Macro "${macro.name}" deleted` });
  } catch (error: any) {
    console.error('Supercharged delete macro error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get autocomplete suggestions ───────────────────────────────────────────

export const getCommandSuggestions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const query = (req.query.q as string) || '';
    const suggestions = getSuggestions(query);

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error: any) {
    console.error('Supercharged suggestions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Scheduled Commands ─────────────────────────────────────────────────────

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const schedules = await prisma.superchargedSchedule.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: { schedules } });
  } catch (error: any) {
    console.error('Supercharged schedules error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, description, cronExpression, timezone, actionType, macroId, intent, slots } = req.body;
    if (!name || !cronExpression || !actionType) {
      return res.status(400).json({ success: false, message: 'name, cronExpression, and actionType are required' });
    }

    if (actionType === 'macro' && !macroId) {
      return res.status(400).json({ success: false, message: 'macroId is required for macro action type' });
    }
    if (actionType === 'intent' && !intent) {
      return res.status(400).json({ success: false, message: 'intent is required for intent action type' });
    }

    // Validate cron expression (basic check)
    const cronParts = cronExpression.trim().split(/\s+/);
    if (cronParts.length < 5 || cronParts.length > 6) {
      return res.status(400).json({ success: false, message: 'Invalid cron expression. Expected 5-6 fields (minute hour day month weekday [year])' });
    }

    // Calculate next run time (simplified — just set to next hour for now)
    const nextRunAt = new Date();
    nextRunAt.setMinutes(0, 0, 0);
    nextRunAt.setHours(nextRunAt.getHours() + 1);

    const schedule = await prisma.superchargedSchedule.create({
      data: {
        userId,
        name,
        description,
        cronExpression: cronExpression.trim(),
        timezone: timezone || 'UTC',
        actionType,
        macroId: macroId || null,
        intent: intent || null,
        slots: slots || null,
        nextRunAt,
      },
    });

    res.json({ success: true, data: { schedule } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: `A schedule named "${req.body.name}" already exists` });
    }
    console.error('Supercharged create schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { scheduleId, ...updates } = req.body;
    if (!scheduleId) return res.status(400).json({ success: false, message: 'scheduleId is required' });

    const existing = await prisma.superchargedSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const allowedFields = ['name', 'description', 'cronExpression', 'timezone', 'actionType', 'macroId', 'intent', 'slots', 'isActive'];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) data[field] = updates[field];
    }

    const schedule = await prisma.superchargedSchedule.update({
      where: { id: scheduleId },
      data,
    });

    res.json({ success: true, data: { schedule } });
  } catch (error: any) {
    console.error('Supercharged update schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { scheduleId } = req.body;
    if (!scheduleId) return res.status(400).json({ success: false, message: 'scheduleId is required' });

    const schedule = await prisma.superchargedSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await prisma.superchargedSchedule.delete({ where: { id: scheduleId } });
    res.json({ success: true, message: `Schedule "${schedule.name}" deleted` });
  } catch (error: any) {
    console.error('Supercharged delete schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── AI-Powered Code Review Summaries ───────────────────────────────────────

export const getCodeReviewSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { projectId, siteId, count } = req.query;
    const commitCount = Math.min(parseInt(count as string) || 5, 20);

    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    // Find the deployment site and its connection
    const site = await prisma.deploymentSite.findUnique({
      where: { id: siteId as string },
      include: {
        connection: true,
        project: true,
      },
    });

    if (!site || !site.connection) {
      return res.status(404).json({ success: false, message: 'Deployment site not found' });
    }

    // Verify user access
    const hasAccess = site.project
      ? (site.project.userId === userId || await prisma.projectMember.findFirst({ where: { projectId: site.project.id, userId } }))
      : site.connection.userId === userId;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Fetch recent deployments as a proxy for commits
    const recentDeploys = await prisma.deployment.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: 'desc' },
      take: commitCount,
      select: {
        id: true,
        gitCommitSha: true,
        gitCommitMessage: true,
        gitBranch: true,
        status: true,
        environment: true,
        createdAt: true,
      },
    });

    if (recentDeploys.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: 'No recent deployments found for this site.',
          deployments: [],
        },
      });
    }

    // Use LLM to summarize the deployments/commits
    const OpenAI = require('openai');
    const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });

    const deploySummary = recentDeploys.map((d, i) =>
      `${i + 1}. [${d.status}] ${d.gitCommitMessage || 'No message'} (${d.gitBranch || 'unknown branch'}, ${d.environment}, ${d.gitCommitSha?.slice(0, 7) || 'no sha'}, ${d.createdAt.toISOString().split('T')[0]})`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a code review assistant. Summarize the following deployment/commit history concisely. Highlight: patterns (frequent failures, environments), risks, and recommendations. Be brief and actionable.',
        },
        {
          role: 'user',
          content: `Summarize these ${recentDeploys.length} recent deployments for site "${site.name}":\n\n${deploySummary}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'Unable to generate summary.';

    res.json({
      success: true,
      data: {
        summary,
        siteName: site.name,
        deploymentCount: recentDeploys.length,
        deployments: recentDeploys,
      },
    });
  } catch (error: any) {
    console.error('Code review summary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
