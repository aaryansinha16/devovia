/**
 * Scheduler Service
 * Handles cron-based scheduling for runbook executions
 */

import {
  PrismaClient,
  ScheduleFrequency,
  ExecutionStatus,
} from '@repo/database';
import { RunbookExecutionService } from './runbook-execution.service';

export class SchedulerService {
  private prisma: PrismaClient;
  private executionService: RunbookExecutionService;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.executionService = new RunbookExecutionService(prisma);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('🕐 Starting Runbook Scheduler...');
    this.isRunning = true;

    // Check for due schedules every minute
    this.schedulerInterval = setInterval(() => {
      this.checkAndExecuteSchedules().catch((error) => {
        console.error('Scheduler error:', error);
      });
    }, 60000); // Every minute

    // Run immediately on start
    this.checkAndExecuteSchedules().catch((error) => {
      console.error('Initial scheduler check error:', error);
    });
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Runbook Scheduler stopped');
  }

  /**
   * Check for due schedules and execute them
   */
  private async checkAndExecuteSchedules(): Promise<void> {
    const now = new Date();

    // Get all active schedules
    const schedules = await this.prisma.runbookSchedule.findMany({
      where: {
        isActive: true,
      },
      include: {
        runbook: {
          select: {
            id: true,
            name: true,
            status: true,
            ownerId: true,
            environment: true,
          },
        },
      },
    });

    for (const schedule of schedules) {
      try {
        if (this.shouldExecute(schedule, now)) {
          await this.executeScheduledRunbook(schedule);
        }
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
      }
    }
  }

  /**
   * Check if a schedule should execute now
   */
  private shouldExecute(schedule: any, now: Date): boolean {
    // Check if next run time has passed
    if (schedule.nextRunAt && schedule.nextRunAt <= now) {
      return true;
    }

    // Parse cron expression if no next run time
    if (schedule.cronExpression) {
      return this.matchesCron(schedule.cronExpression, now);
    }

    // Check frequency-based schedules
    if (schedule.lastRunAt) {
      const lastRun = new Date(schedule.lastRunAt);
      const diffMs = now.getTime() - lastRun.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      switch (schedule.frequency) {
        case ScheduleFrequency.HOURLY:
          return diffMinutes >= 60;
        case ScheduleFrequency.DAILY:
          return diffMinutes >= 1440;
        case ScheduleFrequency.WEEKLY:
          return diffMinutes >= 10080;
        case ScheduleFrequency.MONTHLY:
          return diffMinutes >= 43200;
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Simple cron expression matcher
   */
  private matchesCron(cronExpression: string, date: Date): boolean {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      console.warn(`Invalid cron expression: ${cronExpression}`);
      return false;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const matches = (cronPart: string, value: number): boolean => {
      if (cronPart === '*') return true;
      if (cronPart.includes(',')) {
        return cronPart.split(',').map(Number).includes(value);
      }
      if (cronPart.includes('-')) {
        const [start, end] = cronPart.split('-').map(Number);
        return value >= start && value <= end;
      }
      if (cronPart.includes('/')) {
        const [, step] = cronPart.split('/');
        return value % Number(step) === 0;
      }
      return Number(cronPart) === value;
    };

    return (
      matches(minute, date.getMinutes()) &&
      matches(hour, date.getHours()) &&
      matches(dayOfMonth, date.getDate()) &&
      matches(month, date.getMonth() + 1) &&
      matches(dayOfWeek, date.getDay())
    );
  }

  /**
   * Execute a scheduled runbook
   */
  private async executeScheduledRunbook(schedule: any): Promise<void> {
    console.log(`⏰ Executing scheduled runbook: ${schedule.runbook.name}`);

    // Create execution record
    const execution = await this.prisma.runbookExecution.create({
      data: {
        runbookId: schedule.runbookId,
        status: ExecutionStatus.QUEUED,
        triggeredBy: schedule.createdBy || 'scheduler',
        triggeredByName: 'Scheduler',
        triggerType: 'scheduled',
        environment: schedule.environment,
      },
    });

    // Update schedule timestamps
    const nextRunAt = this.calculateNextRun(schedule);
    await this.prisma.runbookSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
      },
    });

    // Start execution asynchronously
    this.executionService
      .executeRunbook(execution.id, schedule.createdBy || 'scheduler')
      .catch((error) => {
        console.error(
          `Scheduled execution error for ${schedule.runbook.name}:`,
          error,
        );
      });
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRun(schedule: any): Date {
    const now = new Date();

    switch (schedule.frequency) {
      case ScheduleFrequency.HOURLY:
        return new Date(now.getTime() + 60 * 60 * 1000);
      case ScheduleFrequency.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ScheduleFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case ScheduleFrequency.MONTHLY:
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case ScheduleFrequency.CRON:
        // For cron, calculate next occurrence
        return this.getNextCronOccurrence(schedule.cronExpression, now);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get next cron occurrence (simplified)
   */
  private getNextCronOccurrence(cronExpression: string, from: Date): Date {
    // Simple implementation - just add 1 minute and check
    // In production, use a proper cron library
    const next = new Date(from);
    for (let i = 0; i < 1440; i++) {
      // Check up to 24 hours
      next.setMinutes(next.getMinutes() + 1);
      if (this.matchesCron(cronExpression, next)) {
        return next;
      }
    }
    // Fallback to 24 hours
    return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Create a new schedule
   */
  async createSchedule(params: {
    runbookId: string;
    name: string;
    frequency: ScheduleFrequency;
    cronExpression?: string;
    timezone?: string;
    environment: string;
    createdBy: string;
  }): Promise<any> {
    const now = new Date();
    const nextRunAt = this.calculateNextRunFromFrequency(params.frequency, now);

    const schedule = await this.prisma.runbookSchedule.create({
      data: {
        runbookId: params.runbookId,
        name: params.name,
        frequency: params.frequency,
        cronExpression: params.cronExpression,
        timezone: params.timezone || 'UTC',
        environment: params.environment as any,
        nextRunAt,
        isActive: true,
        createdBy: params.createdBy,
      },
    });

    return schedule;
  }

  /**
   * Calculate next run from frequency
   */
  private calculateNextRunFromFrequency(
    frequency: ScheduleFrequency,
    from: Date,
  ): Date {
    switch (frequency) {
      case ScheduleFrequency.HOURLY:
        return new Date(from.getTime() + 60 * 60 * 1000);
      case ScheduleFrequency.DAILY:
        return new Date(from.getTime() + 24 * 60 * 60 * 1000);
      case ScheduleFrequency.WEEKLY:
        return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
      case ScheduleFrequency.MONTHLY:
        const next = new Date(from);
        next.setMonth(next.getMonth() + 1);
        return next;
      default:
        return new Date(from.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: {
      name?: string;
      frequency?: ScheduleFrequency;
      cronExpression?: string;
      timezone?: string;
      isActive?: boolean;
      endsAt?: Date;
    },
  ): Promise<any> {
    const schedule = await this.prisma.runbookSchedule.update({
      where: { id: scheduleId },
      data: updates,
    });

    return schedule;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.prisma.runbookSchedule.delete({
      where: { id: scheduleId },
    });
  }

  /**
   * Get schedules for a runbook
   */
  async getSchedulesForRunbook(runbookId: string): Promise<any[]> {
    return this.prisma.runbookSchedule.findMany({
      where: { runbookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Pause a schedule
   */
  async pauseSchedule(scheduleId: string): Promise<void> {
    await this.prisma.runbookSchedule.update({
      where: { id: scheduleId },
      data: { isActive: false },
    });
  }

  /**
   * Resume a schedule
   */
  async resumeSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.prisma.runbookSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const nextRunAt = this.calculateNextRunFromFrequency(
      schedule.frequency,
      new Date(),
    );

    await this.prisma.runbookSchedule.update({
      where: { id: scheduleId },
      data: {
        isActive: true,
        nextRunAt,
      },
    });
  }
}

export default SchedulerService;
