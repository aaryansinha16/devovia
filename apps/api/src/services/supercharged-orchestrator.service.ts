/**
 * Supercharged Mode — Autonomous Orchestrator Service
 *
 * Event-driven automation engine that matches platform events to user-defined
 * orchestrator rules and executes the corresponding Supercharged intents.
 *
 * Supported trigger events:
 *   - project.created, project.updated, project.deleted
 *   - session.created, session.ended
 *   - deployment.queued, deployment.success, deployment.failed
 *   - runbook.triggered, runbook.completed, runbook.failed
 *   - schedule.daily (cron-like, checked externally)
 */

import prisma from '../lib/prisma';
import { executeIntent } from './supercharged-executor.service';

export interface OrchestratorEvent {
  event: string;                    // e.g. "deployment.failed"
  userId: string;                   // Owner of the event
  data?: Record<string, any>;       // Event payload (projectId, siteId, etc.)
}

/**
 * Process an event and execute any matching orchestrators for the user.
 * This is designed to be called from other services (e.g. after a deployment
 * finishes, after a project is created, etc.).
 */
export async function processOrchestratorEvent(event: OrchestratorEvent): Promise<void> {
  const orchestrators = await prisma.superchargedOrchestrator.findMany({
    where: {
      userId: event.userId,
      triggerEvent: event.event,
      isActive: true,
    },
  });

  if (orchestrators.length === 0) return;

  for (const orch of orchestrators) {
    try {
      // Check conditions
      if (orch.triggerConditions) {
        const conditions = orch.triggerConditions as Record<string, any>;
        const eventData = event.data || {};
        let conditionsMet = true;

        for (const [key, expected] of Object.entries(conditions)) {
          if (eventData[key] !== expected) {
            conditionsMet = false;
            break;
          }
        }

        if (!conditionsMet) continue;
      }

      // Resolve template variables in action slots
      const slotsTemplate = JSON.stringify(orch.actionSlots || {});
      let resolvedSlots = slotsTemplate;

      if (event.data) {
        for (const [key, value] of Object.entries(event.data)) {
          resolvedSlots = resolvedSlots.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            String(value),
          );
        }
      }

      const slots = JSON.parse(resolvedSlots);

      // Execute the action
      const result = await executeIntent(orch.actionIntent, event.userId, slots);

      // Update orchestrator stats
      await prisma.superchargedOrchestrator.update({
        where: { id: orch.id },
        data: {
          runCount: { increment: 1 },
          lastRunAt: new Date(),
          lastRunStatus: result.success ? 'success' : 'failed',
          lastRunError: result.success ? null : result.message,
        },
      });

      // Create an audit record for the automated execution
      await prisma.superchargedCommand.create({
        data: {
          userId: event.userId,
          rawInput: `[Orchestrator: ${orch.name}] ${event.event}`,
          intent: orch.actionIntent,
          confidence: 1.0,
          slots: slots as any,
          status: result.success ? 'EXECUTED' : 'FAILED',
          actionType: `orchestrator:${orch.name}`,
          result: result as any,
          errorMessage: result.success ? null : result.message,
          executedAt: new Date(),
          confirmedAt: new Date(), // Auto-confirmed by orchestrator
        },
      });
    } catch (error: any) {
      console.error(`Orchestrator "${orch.name}" failed:`, error);

      await prisma.superchargedOrchestrator.update({
        where: { id: orch.id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'failed',
          lastRunError: error.message || 'Unknown error',
        },
      });
    }
  }
}

/**
 * Supported trigger events for documentation / validation.
 */
export const SUPPORTED_EVENTS = [
  'project.created',
  'project.updated',
  'project.deleted',
  'session.created',
  'session.ended',
  'deployment.queued',
  'deployment.success',
  'deployment.failed',
  'runbook.triggered',
  'runbook.completed',
  'runbook.failed',
  'schedule.daily',
] as const;
