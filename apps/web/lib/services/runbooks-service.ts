/**
 * Runbooks API Service
 * Handles all API calls for the Runbooks feature
 */

import { API_URL } from "../api-config";
import { getAuthHeaders } from "./auth-service";

async function apiRequest<T>(
  endpoint: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || error.error || "Request failed");
  }

  return response.json();
}

// Types
export interface Runbook {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DEPRECATED";
  environment: "DEVELOPMENT" | "STAGING" | "PRODUCTION";
  tags: string[];
  version: number;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  steps: RunbookStep[];
  parameters?: Record<string, any>;
  variables?: Record<string, any>;
  timeoutSeconds?: number;
}

export interface RunbookStep {
  id: string;
  name: string;
  type:
    | "HTTP"
    | "SQL"
    | "SHELL"
    | "SCRIPT"
    | "MANUAL"
    | "CONDITIONAL"
    | "AI"
    | "WAIT"
    | "PARALLEL";
  description?: string;
  config: Record<string, any>;
  onFailure?: "STOP" | "CONTINUE" | "ROLLBACK" | "RETRY";
  retryConfig?: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier?: number;
  };
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  status:
    | "QUEUED"
    | "RUNNING"
    | "PAUSED"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "TIMEOUT";
  triggeredBy: string;
  triggeredByName?: string;
  triggerType: "manual" | "scheduled" | "webhook" | "api";
  environment: string;
  startedAt?: string;
  finishedAt?: string;
  currentStep?: number;
  totalSteps?: number;
  createdAt: string;
  runbook?: Runbook;
}

export interface RunbookLog {
  id: string;
  executionId: string;
  stepIndex?: number;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface CreateRunbookRequest {
  name: string;
  description?: string;
  environment?: "DEVELOPMENT" | "STAGING" | "PRODUCTION";
  tags?: string[];
  steps: RunbookStep[];
  parameters?: Record<string, any>;
  variables?: Record<string, any>;
  timeoutSeconds?: number;
}

export interface UpdateRunbookRequest extends Partial<CreateRunbookRequest> {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DEPRECATED";
  createVersion?: boolean;
}

export interface ExecuteRunbookRequest {
  parameters?: Record<string, any>;
  environment?: string;
}

export interface PendingApproval {
  id: string;
  executionId: string;
  stepIndex: number;
  stepName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  requestedAt: string;
  expiresAt?: string;
  execution: {
    runbook: {
      id: string;
      name: string;
      description?: string;
      environment: string;
    };
  };
}

export interface Secret {
  id: string;
  name: string;
  type: "API_KEY" | "PASSWORD" | "TOKEN" | "CERTIFICATE" | "SSH_KEY" | "OTHER";
  environment?: string;
  description?: string;
  version: number;
  createdAt: string;
}

export interface Schedule {
  id: string;
  runbookId: string;
  name?: string;
  frequency: "ONCE" | "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "CRON";
  cronExpression?: string;
  timezone: string;
  isActive: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
}

// API Functions

/**
 * List all runbooks
 */
export async function listRunbooks(params?: {
  status?: string;
  environment?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<Runbook[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.environment) searchParams.set("environment", params.environment);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.pageSize)
    searchParams.set("pageSize", params.pageSize.toString());

  const query = searchParams.toString();
  const response = await apiRequest<{ data: Runbook[]; total: number }>(`/runbooks${query ? `?${query}` : ""}`);
  return response.data;
}

/**
 * Get a single runbook by ID
 */
export async function getRunbook(id: string): Promise<Runbook> {
  return apiRequest<Runbook>(`/runbooks/${id}`);
}

/**
 * Create a new runbook
 */
export async function createRunbook(
  data: CreateRunbookRequest,
): Promise<Runbook> {
  return apiRequest<Runbook>("/runbooks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a runbook
 */
export async function updateRunbook(
  id: string,
  data: UpdateRunbookRequest,
): Promise<Runbook> {
  return apiRequest<Runbook>(`/runbooks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a runbook
 */
export async function deleteRunbook(id: string): Promise<void> {
  return apiRequest<void>(`/runbooks/${id}`, {
    method: "DELETE",
  });
}

/**
 * Execute a runbook
 */
export async function executeRunbook(
  id: string,
  data?: ExecuteRunbookRequest,
): Promise<RunbookExecution> {
  return apiRequest<RunbookExecution>(`/runbooks/${id}/execute`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

/**
 * List executions for a runbook
 */
export async function listExecutions(
  runbookId: string,
): Promise<RunbookExecution[]> {
  return apiRequest<RunbookExecution[]>(`/runbooks/${runbookId}/executions`);
}

/**
 * Get execution details
 */
export async function getExecution(
  executionId: string,
): Promise<RunbookExecution> {
  return apiRequest<RunbookExecution>(`/runbooks/executions/${executionId}`);
}

/**
 * Cancel an execution
 */
export async function cancelExecution(executionId: string): Promise<void> {
  return apiRequest<void>(`/runbooks/executions/${executionId}/cancel`, {
    method: "POST",
  });
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(): Promise<PendingApproval[]> {
  return apiRequest<PendingApproval[]>("/runbooks/approvals/pending");
}

/**
 * Approve an approval request
 */
export async function approveApproval(
  approvalId: string,
  comment?: string,
): Promise<void> {
  return apiRequest<void>(`/runbooks/approvals/${approvalId}/approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

/**
 * Reject an approval request
 */
export async function rejectApproval(
  approvalId: string,
  reason: string,
): Promise<void> {
  return apiRequest<void>(`/runbooks/approvals/${approvalId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/**
 * List secrets
 */
export async function listSecrets(params?: {
  runbookId?: string;
  environment?: string;
}): Promise<Secret[]> {
  const searchParams = new URLSearchParams();
  if (params?.runbookId) searchParams.set("runbookId", params.runbookId);
  if (params?.environment) searchParams.set("environment", params.environment);

  const query = searchParams.toString();
  return apiRequest<Secret[]>(`/runbooks/secrets${query ? `?${query}` : ""}`);
}

/**
 * Create a secret
 */
export async function createSecret(data: {
  name: string;
  value: string;
  type: string;
  environment?: string;
  runbookId?: string;
  description?: string;
}): Promise<{ id: string; name: string }> {
  return apiRequest<{ id: string; name: string }>("/runbooks/secrets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a secret
 */
export async function deleteSecret(secretId: string): Promise<void> {
  return apiRequest<void>(`/runbooks/secrets/${secretId}`, {
    method: "DELETE",
  });
}

/**
 * List schedules for a runbook
 */
export async function listSchedules(runbookId: string): Promise<Schedule[]> {
  return apiRequest<Schedule[]>(`/runbooks/${runbookId}/schedules`);
}

/**
 * Create a schedule
 */
export async function createSchedule(
  runbookId: string,
  data: {
    name: string;
    frequency: string;
    cronExpression?: string;
    timezone?: string;
  },
): Promise<Schedule> {
  return apiRequest<Schedule>(`/runbooks/${runbookId}/schedules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  return apiRequest<void>(`/runbooks/schedules/${scheduleId}`, {
    method: "DELETE",
  });
}

/**
 * Pause a schedule
 */
export async function pauseSchedule(scheduleId: string): Promise<void> {
  return apiRequest<void>(`/runbooks/schedules/${scheduleId}/pause`, {
    method: "POST",
  });
}

/**
 * Resume a schedule
 */
export async function resumeSchedule(scheduleId: string): Promise<void> {
  return apiRequest<void>(`/runbooks/schedules/${scheduleId}/resume`, {
    method: "POST",
  });
}

export default {
  listRunbooks,
  getRunbook,
  createRunbook,
  updateRunbook,
  deleteRunbook,
  executeRunbook,
  listExecutions,
  getExecution,
  cancelExecution,
  getPendingApprovals,
  approveApproval,
  rejectApproval,
  listSecrets,
  createSecret,
  deleteSecret,
  listSchedules,
  createSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
};
