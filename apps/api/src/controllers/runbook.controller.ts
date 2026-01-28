/**
 * Runbook Controller
 * Handles business logic for runbook CRUD operations and execution
 */

import { Request, Response } from 'express';
import prisma, { RunbookStatus, ExecutionStatus } from '../lib/prisma';
import {
  CreateRunbookRequest,
  UpdateRunbookRequest,
  ExecuteRunbookRequest,
} from '../types/runbook.types';
import { RunbookExecutionService } from '../services/runbook-execution.service';
import { 
  internalServerError, 
  paginatedResponse, 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError 
} from '../utils/response.util';
import { buildPaginationMeta } from '../utils/pagination.util';

const executionService = new RunbookExecutionService(prisma);

// ============================================================================
// RUNBOOK CRUD OPERATIONS
// ============================================================================

/**
 * List all runbooks with filtering and pagination
 */
export async function listRunbooks(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      page = 1,
      limit = 20,
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

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

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

    res.json(
      paginatedResponse(
        runbooks,
        buildPaginationMeta(Number(page), Number(limit), total),
        'Runbooks retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error listing runbooks:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get a single runbook by ID
 */
export async function getRunbookById(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
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
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    // Check permissions
    const hasAccess =
      runbook.ownerId === userId ||
      runbook.permissions.some((p) => p.userId === userId && p.canView);

    if (!hasAccess) {
      return res.status(403).json(permissionError('You do not have permission to view this runbook'));
    }

    res.json(successResponse(runbook));
  } catch (error: any) {
    console.error('Error fetching runbook:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new runbook
 */
export async function createRunbook(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
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
        status: RunbookStatus.ACTIVE,
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

    res.status(201).json(successResponse(runbook, 'Runbook created successfully'));
  } catch (error: any) {
    console.error('Error creating runbook:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Update a runbook
 */
export async function updateRunbook(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;
    const data: UpdateRunbookRequest = req.body;

    // Check ownership or edit permission
    const existingRunbook = await prisma.runbook.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!existingRunbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    const canEdit =
      existingRunbook.ownerId === userId ||
      existingRunbook.permissions.some((p) => p.userId === userId && p.canEdit);

    if (!canEdit) {
      return res.status(403).json(permissionError('You do not have permission to edit this runbook'));
    }

    // Create new version only if explicitly requested
    const shouldCreateVersion = data.createVersion === true;

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

      return res.json(successResponse(newVersion, 'New version created successfully'));
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

    res.json(successResponse(updatedRunbook, 'Runbook updated successfully'));
  } catch (error: any) {
    console.error('Error updating runbook:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Delete a runbook
 */
export async function deleteRunbook(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;

    const runbook = await prisma.runbook.findUnique({
      where: { id },
    });

    if (!runbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    if (runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('Only the owner can delete this runbook'));
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

    res.json(successResponse(null, 'Runbook deleted successfully'));
  } catch (error: any) {
    console.error('Error deleting runbook:', error);
    res.status(500).json(internalServerError(error));
  }
}

// ============================================================================
// RUNBOOK EXECUTION
// ============================================================================

/**
 * Execute a runbook
 */
export async function executeRunbook(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;
    const data: ExecuteRunbookRequest = req.body;

    const runbook = await prisma.runbook.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!runbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    // Check execute permission
    const canExecute =
      runbook.ownerId === userId ||
      runbook.permissions.some((p) => p.userId === userId && p.canExecute);

    if (!canExecute) {
      return res.status(403).json(permissionError('You do not have permission to execute this runbook'));
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

    res.status(202).json(successResponse(execution, 'Runbook execution started'));
  } catch (error: any) {
    console.error('Error starting execution:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * List executions for a runbook
 */
export async function listRunbookExecutions(req: Request, res: Response) {
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

    res.json(
      paginatedResponse(
        executions,
        buildPaginationMeta(Number(page), Number(pageSize), total),
        'Executions retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('Error listing executions:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get execution details
 */
export async function getExecutionById(req: Request, res: Response) {
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
          take: 1000,
        },
        approvals: true,
      },
    });

    if (!execution) {
      return res.status(404).json(notFoundError('Execution not found'));
    }

    res.json(successResponse(execution));
  } catch (error: any) {
    console.error('Error fetching execution:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Cancel a running execution
 */
export async function cancelExecution(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const execution = await prisma.runbookExecution.findUnique({
      where: { id },
      include: { runbook: true },
    });

    if (!execution) {
      return res.status(404).json(notFoundError('Execution not found'));
    }

    if (
      execution.status !== ExecutionStatus.RUNNING &&
      execution.status !== ExecutionStatus.QUEUED
    ) {
      return res.status(400).json(errorResponse({ code: 'INVALID_STATE', message: 'Execution cannot be cancelled' }));
    }

    await prisma.runbookExecution.update({
      where: { id },
      data: {
        status: ExecutionStatus.CANCELLED,
        finishedAt: new Date(),
      },
    });

    res.json(successResponse(null, 'Execution cancelled successfully'));
  } catch (error: any) {
    console.error('Error cancelling execution:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Stream execution logs via SSE
 */
export async function streamExecutionLogs(req: Request, res: Response) {
  const { id } = req.params;
  const token = req.query.token as string;

  // Verify token from query parameter (EventSource doesn't support headers)
  if (!token) {
    return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
  }

  // Manually verify JWT token
  try {
    const jwt = await import('jsonwebtoken');
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );
    (req as any).user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Invalid token' }));
  }

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

  // Listen for status updates
  const statusHandler = async (data: any) => {
    if (data.executionId === id) {
      const execution = await prisma.runbookExecution.findUnique({
        where: { id },
        select: {
          status: true,
          currentStep: true,
          totalSteps: true,
          finishedAt: true,
        },
      });

      if (execution) {
        res.write(`event: status\ndata: ${JSON.stringify(execution)}\n\n`);
      }
    }
  };

  executionService.on('log', logHandler);
  executionService.on('execution:started', statusHandler);
  executionService.on('execution:progress', statusHandler);
  executionService.on('execution:completed', statusHandler);
  executionService.on('execution:failed', statusHandler);

  req.on('close', () => {
    executionService.off('log', logHandler);
    executionService.off('execution:started', statusHandler);
    executionService.off('execution:progress', statusHandler);
    executionService.off('execution:completed', statusHandler);
    executionService.off('execution:failed', statusHandler);
  });
}
