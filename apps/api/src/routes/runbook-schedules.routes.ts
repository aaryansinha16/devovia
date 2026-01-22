/**
 * Runbook Schedules API Routes
 * Handles CRUD operations for runbook scheduling
 */

import { Router, Request, Response } from 'express';
import prisma, { ScheduleFrequency } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';
import { SchedulerService } from '../services/scheduler.service';

const router = Router();
const schedulerService = new SchedulerService(prisma);

/**
 * GET /api/runbooks/:runbookId/schedules
 * List schedules for a runbook
 */
router.get(
  '/:runbookId/schedules',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { runbookId } = req.params;

      // Verify access to runbook
      const runbook = await prisma.runbook.findUnique({
        where: { id: runbookId },
        select: { ownerId: true },
      });

      if (!runbook) {
        return res.status(404).json({ error: 'Runbook not found' });
      }

      if (runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const schedules =
        await schedulerService.getSchedulesForRunbook(runbookId);

      res.json(schedules);
    } catch (error: any) {
      console.error('Error listing schedules:', error);
      res.status(500).json({ error: 'Failed to list schedules' });
    }
  },
);

/**
 * POST /api/runbooks/:runbookId/schedules
 * Create a new schedule
 */
router.post(
  '/:runbookId/schedules',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { runbookId } = req.params;
      const { name, frequency, cronExpression, timezone } = req.body;

      if (!name || !frequency) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: name, frequency' });
      }

      // Verify access to runbook
      const runbook = await prisma.runbook.findUnique({
        where: { id: runbookId },
        select: { ownerId: true, environment: true },
      });

      if (!runbook) {
        return res.status(404).json({ error: 'Runbook not found' });
      }

      if (runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate cron expression for custom frequency
      if (frequency === ScheduleFrequency.CRON && !cronExpression) {
        return res
          .status(400)
          .json({ error: 'Cron expression required for CRON frequency' });
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

      res.status(201).json(schedule);
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  },
);

/**
 * PUT /api/runbooks/schedules/:id
 * Update a schedule
 */
router.put(
  '/schedules/:id',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
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
        return res.status(404).json({ error: 'Schedule not found' });
      }

      if (schedule.runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedSchedule = await schedulerService.updateSchedule(id, {
        name,
        frequency,
        cronExpression,
        timezone,
        isActive,
        endsAt: endsAt ? new Date(endsAt) : undefined,
      });

      res.json(updatedSchedule);
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  },
);

/**
 * DELETE /api/runbooks/schedules/:id
 * Delete a schedule
 */
router.delete(
  '/schedules/:id',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
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
        return res.status(404).json({ error: 'Schedule not found' });
      }

      if (schedule.runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await schedulerService.deleteSchedule(id);

      res.json({ message: 'Schedule deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  },
);

/**
 * POST /api/runbooks/schedules/:id/pause
 * Pause a schedule
 */
router.post(
  '/schedules/:id/pause',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
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
        return res.status(404).json({ error: 'Schedule not found' });
      }

      if (schedule.runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await schedulerService.pauseSchedule(id);

      res.json({ message: 'Schedule paused' });
    } catch (error: any) {
      console.error('Error pausing schedule:', error);
      res.status(500).json({ error: 'Failed to pause schedule' });
    }
  },
);

/**
 * POST /api/runbooks/schedules/:id/resume
 * Resume a paused schedule
 */
router.post(
  '/schedules/:id/resume',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
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
        return res.status(404).json({ error: 'Schedule not found' });
      }

      if (schedule.runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await schedulerService.resumeSchedule(id);

      res.json({ message: 'Schedule resumed' });
    } catch (error: any) {
      console.error('Error resuming schedule:', error);
      res.status(500).json({ error: 'Failed to resume schedule' });
    }
  },
);

/**
 * GET /api/runbooks/schedules/frequencies
 * Get available schedule frequencies
 */
router.get(
  '/frequencies',
  authenticateJWT,
  async (_req: Request, res: Response) => {
    res.json({
      frequencies: Object.values(ScheduleFrequency),
    });
  },
);

export default router;
