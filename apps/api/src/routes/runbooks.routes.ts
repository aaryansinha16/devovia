/**
 * Runbooks API Routes
 * Handles CRUD operations for runbooks, execution, scheduling, and management
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, RunbookStatus, ExecutionStatus } from '@repo/database';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  CreateRunbookRequest,
  UpdateRunbookRequest,
  ExecuteRunbookRequest,
} from '../types/runbook.types';
import { RunbookExecutionService } from '../services/runbook-execution.service';

const router = Router();
const prisma = new PrismaClient();
const executionService = new RunbookExecutionService(prisma);

// ============================================================================
// RUNBOOK CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/runbooks
 * List all runbooks with filtering and pagination
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      page = 1,
      pageSize = 20,
      status,
      environment,
      tags,
      search,
    } = req.query;

    const filters: any = {
      ownerId: userId,
    };

    if (status) {
      filters.status = { in: Array.isArray(status) ? status : [status] };
    }

    if (environment) {
      filters.environment = {
        in: Array.isArray(environment) ? environment : [environment],
      };
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = { hasSome: tagArray };
    }

    if (search) {
      filters.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [runbooks, total] = await Promise.all([
      prisma.runbook.findMany({
        where: filters,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: {
            select: { executions: true },
          },
        },
      }),
      prisma.runbook.count({ where: filters }),
    ]);

    res.json({
      data: runbooks,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    });
  } catch (error: any) {
    console.error('Error listing runbooks:', error);
    res.status(500).json({ error: 'Failed to list runbooks' });
  }
});

/**
 * GET /api/runbooks/:id
 * Get a single runbook by ID
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const runbook = await prisma.runbook.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        permissions: true,
        schedules: {
          where: { isActive: true },
        },
        _count: {
          select: { executions: true, secrets: true },
        },
      },
    });

    if (!runbook) {
      return res.status(404).json({ error: 'Runbook not found' });
    }

    // Check permissions
    const hasAccess =
      runbook.ownerId === userId ||
      runbook.permissions.some((p) => p.userId === userId && p.canView);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(runbook);
  } catch (error: any) {
    console.error('Error fetching runbook:', error);
    res.status(500).json({ error: 'Failed to fetch runbook' });
  }
});

/**
 * POST /api/runbooks
 * Create a new runbook
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data: CreateRunbookRequest = req.body;

    const runbook = await prisma.runbook.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        environment: data.environment,
        tags: data.tags || [],
        steps: data.steps as any,
        parameters: data.parameters as any,
        variables: data.variables as any,
        timeoutSeconds: data.timeoutSeconds || 3600,
        retryPolicy: data.retryPolicy as any,
        rollbackSteps: data.rollbackSteps as any,
        status: RunbookStatus.DRAFT,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Create audit log
    await prisma.runbookAuditLog.create({
      data: {
        runbookId: runbook.id,
        userId: userId,
        userName: undefined,
        action: 'created',
        resourceType: 'runbook',
        resourceId: runbook.id,
        newValue: runbook as any,
      },
    });

    res.status(201).json(runbook);
  } catch (error: any) {
    console.error('Error creating runbook:', error);
    res.status(500).json({ error: 'Failed to create runbook' });
  }
});

/**
 * PUT /api/runbooks/:id
 * Update a runbook
 */
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const data: UpdateRunbookRequest = req.body;

    // Check ownership or edit permission
    const existingRunbook = await prisma.runbook.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!existingRunbook) {
      return res.status(404).json({ error: 'Runbook not found' });
    }

    const canEdit =
      existingRunbook.ownerId === userId ||
      existingRunbook.permissions.some((p) => p.userId === userId && p.canEdit);

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create new version if status is changing to ACTIVE
    const shouldCreateVersion =
      data.status === RunbookStatus.ACTIVE &&
      existingRunbook.status !== RunbookStatus.ACTIVE;

    if (shouldCreateVersion) {
      // Mark current version as not latest
      await prisma.runbook.update({
        where: { id },
        data: { isLatest: false },
      });

      // Create new version
      const newVersion = await prisma.runbook.create({
        data: {
          name: data.name || existingRunbook.name,
          description: data.description || existingRunbook.description,
          ownerId: existingRunbook.ownerId,
          teamId: existingRunbook.teamId,
          status: RunbookStatus.ACTIVE,
          environment: data.environment || existingRunbook.environment,
          tags: data.tags || existingRunbook.tags,
          steps: (data.steps || existingRunbook.steps) as any,
          parameters: (data.parameters || existingRunbook.parameters) as any,
          variables: (data.variables || existingRunbook.variables) as any,
          timeoutSeconds: data.timeoutSeconds || existingRunbook.timeoutSeconds,
          retryPolicy: (data.retryPolicy || existingRunbook.retryPolicy) as any,
          rollbackSteps: (data.rollbackSteps ||
            existingRunbook.rollbackSteps) as any,
          version: existingRunbook.version + 1,
          isLatest: true,
          parentId: id,
          collaborativeSessionId: existingRunbook.collaborativeSessionId,
          publishedAt: new Date(),
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      return res.json(newVersion);
    }

    // Regular update
    const updatedRunbook = await prisma.runbook.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        environment: data.environment,
        tags: data.tags,
        steps: data.steps as any,
        parameters: data.parameters as any,
        variables: data.variables as any,
        timeoutSeconds: data.timeoutSeconds,
        retryPolicy: data.retryPolicy as any,
        rollbackSteps: data.rollbackSteps as any,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Create audit log
    await prisma.runbookAuditLog.create({
      data: {
        runbookId: id,
        userId: userId,
        userName: undefined,
        action: 'updated',
        resourceType: 'runbook',
        resourceId: id,
        previousValue: existingRunbook as any,
        newValue: updatedRunbook as any,
      },
    });

    res.json(updatedRunbook);
  } catch (error: any) {
    console.error('Error updating runbook:', error);
    res.status(500).json({ error: 'Failed to update runbook' });
  }
});

/**
 * DELETE /api/runbooks/:id
 * Delete a runbook
 */
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const runbook = await prisma.runbook.findUnique({
      where: { id },
    });

    if (!runbook) {
      return res.status(404).json({ error: 'Runbook not found' });
    }

    if (runbook.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.runbook.delete({ where: { id } });

    // Create audit log
    await prisma.runbookAuditLog.create({
      data: {
        runbookId: id,
        userId: userId,
        userName: undefined,
        action: 'deleted',
        resourceType: 'runbook',
        resourceId: id,
        previousValue: runbook as any,
      },
    });

    res.json({ message: 'Runbook deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting runbook:', error);
    res.status(500).json({ error: 'Failed to delete runbook' });
  }
});

// ============================================================================
// RUNBOOK EXECUTION
// ============================================================================

/**
 * POST /api/runbooks/:id/execute
 * Execute a runbook
 */
router.post(
  '/:id/execute',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const data: ExecuteRunbookRequest = req.body;

      const runbook = await prisma.runbook.findUnique({
        where: { id },
        include: { permissions: true },
      });

      if (!runbook) {
        return res.status(404).json({ error: 'Runbook not found' });
      }

      // Check execute permission
      const canExecute =
        runbook.ownerId === userId ||
        runbook.permissions.some((p) => p.userId === userId && p.canExecute);

      if (!canExecute) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Create execution record
      const execution = await prisma.runbookExecution.create({
        data: {
          runbookId: id,
          status: ExecutionStatus.QUEUED,
          triggeredBy: userId,
          triggeredByName: undefined,
          triggerType: 'manual',
          inputParams: data.parameters as any,
          environment: data.environment || runbook.environment,
        },
      });

      // Start execution asynchronously
      executionService.executeRunbook(execution.id, userId).catch((error) => {
        console.error('Execution error:', error);
      });

      res.status(202).json(execution);
    } catch (error: any) {
      console.error('Error starting execution:', error);
      res.status(500).json({ error: 'Failed to start execution' });
    }
  },
);

/**
 * GET /api/runbooks/:id/executions
 * List executions for a runbook
 */
router.get(
  '/:id/executions',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 20, status } = req.query;

      const filters: any = { runbookId: id };

      if (status) {
        filters.status = { in: Array.isArray(status) ? status : [status] };
      }

      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const [executions, total] = await Promise.all([
        prisma.runbookExecution.findMany({
          where: filters,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { logs: true, stepResults: true },
            },
          },
        }),
        prisma.runbookExecution.count({ where: filters }),
      ]);

      res.json({
        data: executions,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      });
    } catch (error: any) {
      console.error('Error listing executions:', error);
      res.status(500).json({ error: 'Failed to list executions' });
    }
  },
);

/**
 * GET /api/executions/:id
 * Get execution details
 */
router.get(
  '/executions/:id',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const execution = await prisma.runbookExecution.findUnique({
        where: { id },
        include: {
          runbook: {
            select: {
              id: true,
              name: true,
              description: true,
              environment: true,
            },
          },
          stepResults: {
            orderBy: { stepIndex: 'asc' },
          },
          logs: {
            orderBy: { timestamp: 'asc' },
            take: 1000, // Limit logs
          },
          approvals: true,
        },
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      res.json(execution);
    } catch (error: any) {
      console.error('Error fetching execution:', error);
      res.status(500).json({ error: 'Failed to fetch execution' });
    }
  },
);

/**
 * POST /api/executions/:id/cancel
 * Cancel a running execution
 */
router.post(
  '/executions/:id/cancel',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const execution = await prisma.runbookExecution.findUnique({
        where: { id },
        include: { runbook: true },
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      if (
        execution.status !== ExecutionStatus.RUNNING &&
        execution.status !== ExecutionStatus.QUEUED
      ) {
        return res.status(400).json({ error: 'Execution cannot be cancelled' });
      }

      await prisma.runbookExecution.update({
        where: { id },
        data: {
          status: ExecutionStatus.CANCELLED,
          finishedAt: new Date(),
        },
      });

      res.json({ message: 'Execution cancelled' });
    } catch (error: any) {
      console.error('Error cancelling execution:', error);
      res.status(500).json({ error: 'Failed to cancel execution' });
    }
  },
);

/**
 * GET /api/executions/:id/logs/stream
 * Stream execution logs via SSE
 */
router.get(
  '/executions/:id/logs/stream',
  authenticateJWT,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send existing logs
    const logs = await prisma.runbookLog.findMany({
      where: { executionId: id },
      orderBy: { timestamp: 'asc' },
    });

    for (const log of logs) {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    }

    // Listen for new logs
    const logHandler = (data: any) => {
      if (data.executionId === id) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    executionService.on('log', logHandler);

    req.on('close', () => {
      executionService.off('log', logHandler);
    });
  },
);

export default router;
