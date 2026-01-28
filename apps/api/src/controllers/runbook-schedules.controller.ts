/**
 * Runbook Schedules Controller
 * Handles business logic for runbook scheduling operations
 */

import { Request, Response } from 'express';
import prisma, { ScheduleFrequency } from '../lib/prisma';
import { SchedulerService } from '../services/scheduler.service';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError 
} from '../utils/response.util';

const schedulerService = new SchedulerService(prisma);

/**
 * List schedules for a runbook
 */
export async function listSchedules(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { runbookId } = req.params;

    // Verify access to runbook
    const runbook = await prisma.runbook.findUnique({
      where: { id: runbookId },
      select: { ownerId: true },
    });

    if (!runbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    if (runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('You do not have permission to access this runbook'));
    }

    const schedules = await schedulerService.getSchedulesForRunbook(runbookId);

    res.json(successResponse(schedules));
  } catch (error: any) {
    console.error('Error listing schedules:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new schedule
 */
export async function createSchedule(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { runbookId } = req.params;
    const { name, frequency, cronExpression, timezone } = req.body;

    if (!name || !frequency) {
      return res
        .status(400)
        .json(errorResponse({ code: 'VALIDATION_ERROR', message: 'Missing required fields: name, frequency' }));
    }

    // Verify access to runbook
    const runbook = await prisma.runbook.findUnique({
      where: { id: runbookId },
      select: { ownerId: true, environment: true },
    });

    if (!runbook) {
      return res.status(404).json(notFoundError('Runbook not found'));
    }

    if (runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('You do not have permission to access this runbook'));
    }

    // Validate cron expression for custom frequency
    if (frequency === ScheduleFrequency.CRON && !cronExpression) {
      return res
        .status(400)
        .json(errorResponse({ code: 'VALIDATION_ERROR', message: 'Cron expression required for CRON frequency' }));
    }

    const schedule = await schedulerService.createSchedule({
      runbookId,
      name,
      frequency: frequency as ScheduleFrequency,
      cronExpression,
      timezone,
      environment: runbook.environment || 'DEVELOPMENT',
      createdBy: userId,
    });

    res.status(201).json(successResponse(schedule, 'Schedule created successfully'));
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Update a schedule
 */
export async function updateSchedule(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;
    const { name, frequency, cronExpression, timezone, isActive, endsAt } =
      req.body;

    // Verify ownership
    const schedule = await prisma.runbookSchedule.findUnique({
      where: { id },
      include: {
        runbook: {
          select: { ownerId: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json(notFoundError('Schedule not found'));
    }

    if (schedule.runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('You do not have permission to modify this schedule'));
    }

    const updatedSchedule = await schedulerService.updateSchedule(id, {
      name,
      frequency,
      cronExpression,
      timezone,
      isActive,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });

    res.json(successResponse(updatedSchedule, 'Schedule updated successfully'));
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;

    // Verify ownership
    const schedule = await prisma.runbookSchedule.findUnique({
      where: { id },
      include: {
        runbook: {
          select: { ownerId: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json(notFoundError('Schedule not found'));
    }

    if (schedule.runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('You do not have permission to modify this schedule'));
    }

    await schedulerService.deleteSchedule(id);

    res.json(successResponse(null, 'Schedule deleted successfully'));
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Pause a schedule
 */
export async function pauseSchedule(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;

    // Verify ownership
    const schedule = await prisma.runbookSchedule.findUnique({
      where: { id },
      include: {
        runbook: {
          select: { ownerId: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json(notFoundError('Schedule not found'));
    }

    if (schedule.runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('You do not have permission to modify this schedule'));
    }

    await schedulerService.pauseSchedule(id);

    res.json(successResponse(null, 'Schedule paused successfully'));
  } catch (error: any) {
    console.error('Error pausing schedule:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Resume a paused schedule
 */
export async function resumeSchedule(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;

    // Verify ownership
    const schedule = await prisma.runbookSchedule.findUnique({
      where: { id },
      include: {
        runbook: {
          select: { ownerId: true },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json(notFoundError('Schedule not found'));
    }

    if (schedule.runbook.ownerId !== userId) {
      return res.status(403).json(permissionError('You do not have permission to modify this schedule'));
    }

    await schedulerService.resumeSchedule(id);

    res.json(successResponse(null, 'Schedule resumed successfully'));
  } catch (error: any) {
    console.error('Error resuming schedule:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get available schedule frequencies
 */
export async function getFrequencies(_req: Request, res: Response) {
  res.json(successResponse({ frequencies: Object.values(ScheduleFrequency) }));
}
