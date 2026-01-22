/**
 * Runbook Execution Engine
 * Handles the execution of runbook steps with proper error handling, logging, and state management
 */

import { PrismaClient, ExecutionStatus } from '../lib/prisma';

// Step types as string literals (Prisma enums are not available at runtime)
type StepTypeString =
  | 'HTTP'
  | 'SQL'
  | 'SHELL'
  | 'SCRIPT'
  | 'MANUAL'
  | 'CONDITIONAL'
  | 'AI'
  | 'WAIT'
  | 'PARALLEL';
import {
  RunbookStep,
  ExecutionContext,
  StepExecutionResult,
  HttpStep,
  SqlStep,
  ManualStep,
  AiStep,
  WaitStep,
  ConditionalStep,
  ParallelStep,
  StepExecutor,
} from '../types/runbook.types';
import { EventEmitter } from 'events';

export class RunbookExecutionService extends EventEmitter {
  private prisma: PrismaClient;
  private executors: Map<StepTypeString, StepExecutor>;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.executors = new Map();
    this.registerExecutors();
  }

  /**
   * Register step executors for each step type
   */
  private registerExecutors() {
    this.executors.set('HTTP', new HttpStepExecutor());
    this.executors.set('SQL', new SqlStepExecutor(this.prisma));
    this.executors.set('MANUAL', new ManualStepExecutor(this.prisma));
    this.executors.set('AI', new AiStepExecutor());
    this.executors.set('WAIT', new WaitStepExecutor());
    this.executors.set('CONDITIONAL', new ConditionalStepExecutor(this));
    this.executors.set('PARALLEL', new ParallelStepExecutor(this));
    // SHELL and SCRIPT executors will be added when sandboxing is implemented
  }

  /**
   * Execute a runbook
   */
  async executeRunbook(executionId: string, userId: string): Promise<void> {
    try {
      // Get execution details
      const execution = await this.prisma.runbookExecution.findUnique({
        where: { id: executionId },
        include: {
          runbook: true,
        },
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      // Update status to RUNNING
      await this.prisma.runbookExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      this.emit('execution:started', {
        executionId,
        runbookId: execution.runbookId,
      });

      // Build execution context
      const context = await this.buildExecutionContext(execution, userId);

      // Parse steps from runbook
      const steps = execution.runbook.steps as unknown as RunbookStep[];
      const totalSteps = this.countSteps(steps);

      await this.prisma.runbookExecution.update({
        where: { id: executionId },
        data: { totalSteps },
      });

      // Execute steps sequentially
      let currentStepIndex = 0;
      for (const step of steps) {
        await this.executeStep(step, context, currentStepIndex);
        currentStepIndex++;

        // Update progress
        await this.prisma.runbookExecution.update({
          where: { id: executionId },
          data: { currentStep: currentStepIndex },
        });

        // Emit progress update
        this.emit('execution:progress', {
          executionId,
          currentStep: currentStepIndex,
          totalSteps,
        });
      }

      // Mark as successful
      const finishedAt = new Date();

      // Fetch fresh execution to get startedAt
      const updatedExecution = await this.prisma.runbookExecution.findUnique({
        where: { id: executionId },
        select: { startedAt: true },
      });

      const duration = updatedExecution?.startedAt
        ? finishedAt.getTime() - new Date(updatedExecution.startedAt).getTime()
        : 0;

      await this.prisma.runbookExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.SUCCESS,
          finishedAt,
          duration,
        },
      });

      this.emit('execution:completed', {
        executionId,
        runbookId: execution.runbookId,
        status: ExecutionStatus.SUCCESS,
      });
    } catch (error: any) {
      await this.handleExecutionError(executionId, error);
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: RunbookStep,
    context: ExecutionContext,
    stepIndex: number,
  ): Promise<StepExecutionResult> {
    const startedAt = new Date();

    // Log step start
    await this.logMessage(
      context.executionId,
      stepIndex,
      'info',
      `Starting step: ${step.name}`,
      { stepType: step.type },
    );

    try {
      // Get executor for this step type
      const executor = this.executors.get(step.type);
      if (!executor) {
        throw new Error(`No executor found for step type: ${step.type}`);
      }

      // Execute step with timeout
      const timeout = step.timeout || 300; // 5 minutes default
      const result = await this.executeWithTimeout(
        executor.execute(step, context),
        timeout * 1000,
      );

      // Save step result
      await this.saveStepResult(context.executionId, stepIndex, step, result);

      // Store in context for future steps
      context.stepResults.set(step.id, result);

      // Log success
      await this.logMessage(
        context.executionId,
        stepIndex,
        'info',
        `Step completed successfully: ${step.name}`,
        { duration: result.duration },
      );

      return result;
    } catch (error: any) {
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      const result: StepExecutionResult = {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.FAILED,
        startedAt,
        finishedAt,
        duration,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
        attemptNumber: 1,
      };

      // Save failed result
      await this.saveStepResult(context.executionId, stepIndex, step, result);

      // Log error
      await this.logMessage(
        context.executionId,
        stepIndex,
        'error',
        `Step failed: ${step.name}`,
        { error: error.message },
      );

      // Check if we should continue on error
      if (!step.continueOnError) {
        throw error;
      }

      return result;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Step execution timeout')),
          timeoutMs,
        ),
      ),
    ]);
  }

  /**
   * Build execution context
   */
  private async buildExecutionContext(
    execution: any,
    userId: string,
  ): Promise<ExecutionContext> {
    // Decrypt secrets (placeholder - implement encryption service)
    const secrets: Record<string, string> = {};
    const runbookSecrets = await this.prisma.runbookSecret.findMany({
      where: {
        OR: [
          { runbookId: execution.runbookId },
          { runbookId: null }, // Organization-wide secrets
        ],
        environment: execution.environment,
      },
    });

    for (const secret of runbookSecrets) {
      // TODO: Decrypt secret.encryptedValue
      secrets[secret.name] = secret.encryptedValue; // Placeholder
    }

    const context: ExecutionContext = {
      executionId: execution.id,
      runbookId: execution.runbookId,
      environment: execution.environment,
      triggeredBy: userId,
      startedAt: new Date(),
      parameters: (execution.inputParams as any) || {},
      variables: (execution.runbook.variables as any) || {},
      secrets,
      stepResults: new Map(),
      getStepResult: (stepId: string) => context.stepResults.get(stepId),
      setVariable: (name: string, value: string) => {
        context.variables[name] = value;
      },
      log: async (level, message, metadata) => {
        await this.logMessage(
          execution.id,
          undefined,
          level,
          message,
          metadata,
        );
      },
    };

    return context;
  }

  /**
   * Save step result to database
   */
  private async saveStepResult(
    executionId: string,
    stepIndex: number,
    step: RunbookStep,
    result: StepExecutionResult,
  ): Promise<void> {
    await this.prisma.runbookStepResult.create({
      data: {
        executionId,
        stepIndex,
        stepName: step.name,
        stepType: step.type,
        status: result.status,
        startedAt: result.startedAt,
        finishedAt: result.finishedAt,
        duration: result.duration,
        input: result.input as any,
        output: result.output as any,
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        attemptNumber: result.attemptNumber,
      },
    });
  }

  /**
   * Log message
   */
  private async logMessage(
    executionId: string,
    stepIndex: number | undefined,
    level: string,
    message: string,
    metadata?: any,
  ): Promise<void> {
    const timestamp = new Date();

    await this.prisma.runbookLog.create({
      data: {
        executionId,
        stepIndex,
        level,
        message,
        metadata: metadata as any,
        timestamp,
      },
    });

    // Emit log event for real-time streaming
    this.emit('log', {
      executionId,
      stepIndex,
      level,
      message,
      metadata,
      timestamp: timestamp.toISOString(),
    });
  }

  /**
   * Handle execution error
   */
  private async handleExecutionError(
    executionId: string,
    error: Error,
  ): Promise<void> {
    const finishedAt = new Date();

    await this.prisma.runbookExecution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.FAILED,
        finishedAt,
        errorMessage: error.message,
      },
    });

    await this.logMessage(
      executionId,
      undefined,
      'error',
      `Execution failed: ${error.message}`,
    );

    this.emit('execution:failed', { executionId, error: error.message });
  }

  /**
   * Count total steps (including nested steps in conditionals/parallel)
   */
  private countSteps(steps: RunbookStep[]): number {
    let count = 0;
    for (const step of steps) {
      count++;
      if (step.type === 'CONDITIONAL') {
        const conditionalStep = step as ConditionalStep;
        count += this.countSteps(conditionalStep.config.onTrue);
        if (conditionalStep.config.onFalse) {
          count += this.countSteps(conditionalStep.config.onFalse);
        }
      } else if (step.type === 'PARALLEL') {
        const parallelStep = step as ParallelStep;
        count += this.countSteps(parallelStep.config.steps);
      }
    }
    return count;
  }
}

// ============================================================================
// STEP EXECUTORS
// ============================================================================

/**
 * HTTP Step Executor
 */
class HttpStepExecutor implements StepExecutor {
  async execute(step: RunbookStep): Promise<StepExecutionResult> {
    const httpStep = step as HttpStep;
    const startedAt = new Date();

    try {
      const response = await fetch(httpStep.config.url, {
        method: httpStep.config.method,
        headers: httpStep.config.headers,
        body: httpStep.config.body
          ? JSON.stringify(httpStep.config.body)
          : undefined,
      });

      const responseData = await response.json().catch(() => response.text());

      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      // Validate status code
      const expectedCodes = httpStep.config.expectedStatusCodes || [
        200, 201, 204,
      ];
      if (!expectedCodes.includes(response.status)) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.SUCCESS,
        startedAt,
        finishedAt,
        duration,
        input: { url: httpStep.config.url, method: httpStep.config.method },
        output: { status: response.status, data: responseData },
        attemptNumber: 1,
      };
    } catch (error: any) {
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.FAILED,
        startedAt,
        finishedAt,
        duration,
        error: { message: error.message },
        attemptNumber: 1,
      };
    }
  }
}

/**
 * SQL Step Executor
 */
class SqlStepExecutor implements StepExecutor {
  constructor(private prisma: PrismaClient) {}

  async execute(step: RunbookStep): Promise<StepExecutionResult> {
    const sqlStep = step as SqlStep;
    const startedAt = new Date();

    try {
      // Execute raw SQL query
      const result = await this.prisma.$queryRawUnsafe(sqlStep.config.query);

      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.SUCCESS,
        startedAt,
        finishedAt,
        duration,
        input: { query: sqlStep.config.query },
        output: { result },
        attemptNumber: 1,
      };
    } catch (error: any) {
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.FAILED,
        startedAt,
        finishedAt,
        duration,
        error: { message: error.message },
        attemptNumber: 1,
      };
    }
  }
}

/**
 * Manual Approval Step Executor
 */
class ManualStepExecutor implements StepExecutor {
  constructor(private prisma: PrismaClient) {}

  async execute(
    step: RunbookStep,
    context: ExecutionContext,
  ): Promise<StepExecutionResult> {
    const manualStep = step as ManualStep;
    const startedAt = new Date();

    // Create approval request
    const expiresAt = manualStep.config.expiresAfter
      ? new Date(Date.now() + manualStep.config.expiresAfter * 1000)
      : undefined;

    await this.prisma.runbookApproval.create({
      data: {
        executionId: context.executionId,
        stepIndex: 0, // TODO: Pass actual step index
        stepName: step.name,
        requiredApprovers: manualStep.config.approvers,
        requestNote: manualStep.config.instructions,
        expiresAt,
      },
    });

    // This step will pause execution - actual completion happens via approval API
    return {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status: ExecutionStatus.PAUSED,
      startedAt,
      attemptNumber: 1,
    };
  }
}

/**
 * AI Step Executor
 */
class AiStepExecutor implements StepExecutor {
  async execute(step: RunbookStep): Promise<StepExecutionResult> {
    const aiStep = step as AiStep;
    const startedAt = new Date();

    try {
      // TODO: Implement OpenAI API call
      const response = { analysis: 'AI analysis placeholder' };

      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.SUCCESS,
        startedAt,
        finishedAt,
        duration,
        input: { prompt: aiStep.config.prompt },
        output: response,
        attemptNumber: 1,
      };
    } catch (error: any) {
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      return {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: ExecutionStatus.FAILED,
        startedAt,
        finishedAt,
        duration,
        error: { message: error.message },
        attemptNumber: 1,
      };
    }
  }
}

/**
 * Wait Step Executor
 */
class WaitStepExecutor implements StepExecutor {
  async execute(step: RunbookStep): Promise<StepExecutionResult> {
    const waitStep = step as WaitStep;
    const startedAt = new Date();

    await new Promise((resolve) =>
      setTimeout(resolve, waitStep.config.duration * 1000),
    );

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - startedAt.getTime();

    return {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status: ExecutionStatus.SUCCESS,
      startedAt,
      finishedAt,
      duration,
      input: { duration: waitStep.config.duration },
      attemptNumber: 1,
    };
  }
}

/**
 * Conditional Step Executor
 */
class ConditionalStepExecutor implements StepExecutor {
  constructor(private executionService: RunbookExecutionService) {}

  async execute(step: RunbookStep): Promise<StepExecutionResult> {
    const conditionalStep = step as ConditionalStep;
    const startedAt = new Date();

    // Evaluate condition (simplified - implement proper evaluation)
    const conditionMet = true; // Placeholder

    // Execute appropriate branch
    const stepsToExecute = conditionMet
      ? conditionalStep.config.onTrue
      : conditionalStep.config.onFalse || [];

    // TODO: Execute nested steps

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - startedAt.getTime();

    return {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status: ExecutionStatus.SUCCESS,
      startedAt,
      finishedAt,
      duration,
      output: { conditionMet, stepsExecuted: stepsToExecute.length },
      attemptNumber: 1,
    };
  }
}

/**
 * Parallel Step Executor
 */
class ParallelStepExecutor implements StepExecutor {
  constructor(private executionService: RunbookExecutionService) {}

  async execute(step: RunbookStep): Promise<StepExecutionResult> {
    const parallelStep = step as ParallelStep;
    const startedAt = new Date();

    // TODO: Execute steps in parallel

    const finishedAt = new Date();
    const duration = finishedAt.getTime() - startedAt.getTime();

    return {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status: ExecutionStatus.SUCCESS,
      startedAt,
      finishedAt,
      duration,
      output: { stepsExecuted: parallelStep.config.steps.length },
      attemptNumber: 1,
    };
  }
}
