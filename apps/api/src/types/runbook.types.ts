/**
 * TypeScript types and interfaces for Runbooks feature
 * These types define the structure of runbook steps, configurations, and execution context
 */

import {
  RunbookStatus,
  RunbookEnvironment,
  StepType,
  ExecutionStatus,
  SecretType,
  IntegrationType,
  ScheduleFrequency,
} from '@repo/database';

// ============================================================================
// RUNBOOK STEP DEFINITIONS
// ============================================================================

/**
 * Base interface for all runbook steps
 */
export interface BaseRunbookStep {
  id: string;
  name: string;
  description?: string;
  type: StepType;
  continueOnError?: boolean;
  timeout?: number; // in seconds
  retryCount?: number;
  retryDelay?: number; // in milliseconds
}

/**
 * HTTP/Webhook step
 */
export interface HttpStep extends BaseRunbookStep {
  type: 'HTTP';
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    auth?: {
      type: 'bearer' | 'basic' | 'apikey';
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
      apiKeyHeader?: string;
    };
    expectedStatusCodes?: number[];
    validateResponse?: {
      jsonPath?: string;
      expectedValue?: any;
    };
  };
}

/**
 * SQL query step
 */
export interface SqlStep extends BaseRunbookStep {
  type: 'SQL';
  config: {
    connectionString?: string; // Or reference to secret
    secretName?: string; // Reference to stored connection string
    query: string;
    parameters?: Record<string, any>;
    expectedRowCount?: number;
    validateResult?: {
      column: string;
      expectedValue: any;
    };
  };
}

/**
 * Shell command step (requires sandboxing)
 */
export interface ShellStep extends BaseRunbookStep {
  type: 'SHELL';
  config: {
    command: string;
    args?: string[];
    workingDirectory?: string;
    env?: Record<string, string>;
    shell?: 'bash' | 'sh' | 'zsh';
    expectedExitCode?: number;
  };
}

/**
 * Script execution step (Node.js or Python)
 */
export interface ScriptStep extends BaseRunbookStep {
  type: 'SCRIPT';
  config: {
    runtime: 'node' | 'python';
    code: string;
    entrypoint?: string;
    env?: Record<string, string>;
    dependencies?: string[]; // npm packages or pip packages
  };
}

/**
 * Manual approval step
 */
export interface ManualStep extends BaseRunbookStep {
  type: 'MANUAL';
  config: {
    approvers: string[]; // User IDs
    requireAllApprovers?: boolean;
    instructions: string;
    expiresAfter?: number; // in seconds
    notifyVia?: ('email' | 'slack' | 'webhook')[];
  };
}

/**
 * Conditional branching step
 */
export interface ConditionalStep extends BaseRunbookStep {
  type: 'CONDITIONAL';
  config: {
    condition: {
      type: 'expression' | 'previous_step_status' | 'variable_check';
      expression?: string; // JavaScript expression
      stepId?: string; // Reference to previous step
      expectedStatus?: ExecutionStatus;
      variable?: string;
      operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
      value?: any;
    };
    onTrue: RunbookStep[]; // Steps to execute if condition is true
    onFalse?: RunbookStep[]; // Steps to execute if condition is false
  };
}

/**
 * AI-powered step
 */
export interface AiStep extends BaseRunbookStep {
  type: 'AI';
  config: {
    action: 'analyze' | 'generate' | 'suggest' | 'summarize';
    prompt: string;
    context?: {
      includeLogs?: boolean;
      includeMetrics?: boolean;
      includeStepResults?: boolean;
    };
    model?: string; // OpenAI model
    temperature?: number;
    maxTokens?: number;
  };
}

/**
 * Wait/delay step
 */
export interface WaitStep extends BaseRunbookStep {
  type: 'WAIT';
  config: {
    duration: number; // in seconds
    reason?: string;
  };
}

/**
 * Parallel execution step
 */
export interface ParallelStep extends BaseRunbookStep {
  type: 'PARALLEL';
  config: {
    steps: RunbookStep[];
    waitForAll?: boolean; // Wait for all to complete or continue after first success
    failOnAnyError?: boolean;
  };
}

/**
 * Union type for all step types
 */
export type RunbookStep =
  | HttpStep
  | SqlStep
  | ShellStep
  | ScriptStep
  | ManualStep
  | ConditionalStep
  | AiStep
  | WaitStep
  | ParallelStep;

// ============================================================================
// RUNBOOK CONFIGURATION
// ============================================================================

/**
 * Input parameter definition
 */
export interface RunbookParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  description?: string;
  required?: boolean;
  default?: any;
  options?: string[]; // For select/multiselect
  validation?: {
    pattern?: string; // Regex pattern
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Environment variable definition
 */
export interface RunbookVariable {
  name: string;
  value: string;
  description?: string;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number; // in milliseconds
  maxDelay?: number;
  retryOn?: ('timeout' | 'error' | 'http_5xx' | 'http_4xx')[];
}

/**
 * Rollback configuration
 */
export interface RollbackConfig {
  enabled: boolean;
  steps: RunbookStep[];
  triggerOn: ('failure' | 'timeout' | 'manual')[];
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

/**
 * Execution context passed to steps
 */
export interface ExecutionContext {
  executionId: string;
  runbookId: string;
  environment: RunbookEnvironment;
  triggeredBy: string;
  startedAt: Date;

  // Runtime data
  parameters: Record<string, any>;
  variables: Record<string, string>;
  secrets: Record<string, string>; // Decrypted secrets

  // Step results from previous steps
  stepResults: Map<string, StepExecutionResult>;

  // Utility functions
  getStepResult: (stepId: string) => StepExecutionResult | undefined;
  setVariable: (name: string, value: string) => void;
  log: (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: any,
  ) => void;
}

/**
 * Result of a single step execution
 */
export interface StepExecutionResult {
  stepId: string;
  stepName: string;
  stepType: StepType;
  status: ExecutionStatus;
  startedAt: Date;
  finishedAt?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  attemptNumber: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create runbook request
 */
export interface CreateRunbookRequest {
  name: string;
  description?: string;
  environment: RunbookEnvironment;
  tags?: string[];
  steps: RunbookStep[];
  parameters?: RunbookParameter[];
  variables?: RunbookVariable[];
  timeoutSeconds?: number;
  retryPolicy?: RetryPolicy;
  rollbackSteps?: RunbookStep[];
}

/**
 * Update runbook request
 */
export interface UpdateRunbookRequest {
  name?: string;
  description?: string;
  status?: RunbookStatus;
  environment?: RunbookEnvironment;
  tags?: string[];
  steps?: RunbookStep[];
  parameters?: RunbookParameter[];
  variables?: RunbookVariable[];
  timeoutSeconds?: number;
  retryPolicy?: RetryPolicy;
  rollbackSteps?: RunbookStep[];
}

/**
 * Execute runbook request
 */
export interface ExecuteRunbookRequest {
  runbookId: string;
  parameters?: Record<string, any>;
  environment?: RunbookEnvironment;
  dryRun?: boolean;
}

/**
 * Runbook execution response
 */
export interface RunbookExecutionResponse {
  id: string;
  runbookId: string;
  status: ExecutionStatus;
  triggeredBy: string;
  triggeredByName?: string;
  triggerType: string;
  currentStep: number;
  totalSteps: number;
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
  errorMessage?: string;
  errorStep?: number;
  environment: RunbookEnvironment;
}

/**
 * Approval action request
 */
export interface ApprovalActionRequest {
  action: 'approve' | 'reject';
  note?: string;
}

/**
 * Schedule runbook request
 */
export interface ScheduleRunbookRequest {
  runbookId: string;
  name?: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  timezone?: string;
  inputParams?: Record<string, any>;
  environment: RunbookEnvironment;
}

/**
 * Create secret request
 */
export interface CreateSecretRequest {
  runbookId?: string;
  name: string;
  description?: string;
  type: SecretType;
  value: string;
  environment?: RunbookEnvironment;
}

/**
 * Create webhook request
 */
export interface CreateWebhookRequest {
  runbookId: string;
  name: string;
  type: IntegrationType;
  url?: string;
  authConfig?: any;
  triggerOn: string[];
}

// ============================================================================
// EXECUTION ENGINE TYPES
// ============================================================================

/**
 * Step executor interface
 */
export interface StepExecutor {
  execute(
    step: RunbookStep,
    context: ExecutionContext,
  ): Promise<StepExecutionResult>;
}

/**
 * Execution engine configuration
 */
export interface ExecutionEngineConfig {
  maxConcurrentExecutions: number;
  defaultTimeout: number;
  enableSandboxing: boolean;
  sandboxProvider?: 'docker' | 'firecracker' | 'gvisor';
  logRetentionDays: number;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: string;
  runbookId: string;
  runbookName: string;
  executionId: string;
  status: ExecutionStatus;
  triggeredBy: string;
  environment: RunbookEnvironment;
  timestamp: Date;
  data?: any;
}

// ============================================================================
// AI GENERATION TYPES
// ============================================================================

/**
 * AI runbook generation request
 */
export interface GenerateRunbookRequest {
  prompt: string;
  environment?: RunbookEnvironment;
  tags?: string[];
  context?: {
    existingRunbooks?: string[];
    techStack?: string[];
    infrastructure?: string[];
  };
}

/**
 * AI runbook generation response
 */
export interface GenerateRunbookResponse {
  name: string;
  description: string;
  steps: RunbookStep[];
  parameters?: RunbookParameter[];
  variables?: RunbookVariable[];
  suggestedTags?: string[];
  confidence: number; // 0-1
  warnings?: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filter options for listing runbooks
 */
export interface RunbookFilters {
  status?: RunbookStatus[];
  environment?: RunbookEnvironment[];
  tags?: string[];
  ownerId?: string;
  search?: string;
}

/**
 * Filter options for listing executions
 */
export interface ExecutionFilters {
  runbookId?: string;
  status?: ExecutionStatus[];
  triggeredBy?: string;
  environment?: RunbookEnvironment[];
  dateFrom?: Date;
  dateTo?: Date;
}
