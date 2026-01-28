/**
 * Runbook-specific hooks that wrap the generic API hooks
 * with runbook service functions for convenience
 */

import { useApiData, useApiMutation, usePaginatedData } from './useApiData';
import {
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
  type Runbook,
  type RunbookExecution,
  type PendingApproval,
  type Secret,
  type Schedule,
  type CreateRunbookRequest,
  type UpdateRunbookRequest,
  type ExecuteRunbookRequest,
  RunbookPagination,
} from '../services/runbooks-service';
import { useCallback } from 'react';

/**
 * Hook for fetching runbooks with optional filters
 */
export function useRunbooks(params?: {
  status?: string;
  environment?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const fetcher = useCallback(
    () => listRunbooks(params),
    [params?.status, params?.environment, params?.search, params?.page, params?.limit]
  );

  return usePaginatedData<Runbook>(fetcher, params?.page, params?.limit);
}

/**
 * Hook for fetching a single runbook by ID
 */
export function useRunbookById(id: string) {
  return useApiData<Runbook>(
    () => getRunbook(id),
    [id]
  );
}

/**
 * Hook for creating a runbook
 */
export function useCreateRunbook() {
  return useApiMutation<Runbook, CreateRunbookRequest>(createRunbook);
}

/**
 * Hook for updating a runbook
 */
export function useUpdateRunbook(id: string) {
  return useApiMutation<Runbook, UpdateRunbookRequest>(
    (data) => updateRunbook(id, data)
  );
}

/**
 * Hook for deleting a runbook
 */
export function useDeleteRunbook(id: string) {
  return useApiMutation<void, void>(
    () => deleteRunbook(id)
  );
}

/**
 * Hook for executing a runbook
 */
export function useExecuteRunbook(id: string) {
  return useApiMutation<RunbookExecution, ExecuteRunbookRequest | undefined>(
    (data) => executeRunbook(id, data)
  );
}

/**
 * Hook for fetching executions for a runbook
 */
export function useRunbookExecutions(runbookId: string) {
  return useApiData<RunbookExecution[]>(
    () => listExecutions(runbookId),
    [runbookId]
  );
}

/**
 * Hook for fetching a single execution
 */
export function useExecutionById(executionId: string) {
  return useApiData<RunbookExecution>(
    () => getExecution(executionId),
    [executionId]
  );
}

/**
 * Hook for canceling an execution
 */
export function useCancelExecution(executionId: string) {
  return useApiMutation<void, void>(
    () => cancelExecution(executionId)
  );
}

/**
 * Hook for fetching pending approvals
 */
export function usePendingApprovals() {
  return useApiData<PendingApproval[]>(
    () => getPendingApprovals(),
    []
  );
}

/**
 * Hook for approving an approval request
 */
export function useApproveApproval(approvalId: string) {
  return useApiMutation<void, string | undefined>(
    (comment) => approveApproval(approvalId, comment)
  );
}

/**
 * Hook for rejecting an approval request
 */
export function useRejectApproval(approvalId: string) {
  return useApiMutation<void, string>(
    (reason) => rejectApproval(approvalId, reason)
  );
}

/**
 * Hook for fetching secrets
 */
export function useSecrets(params?: {
  runbookId?: string;
  environment?: string;
}) {
  return useApiData<Secret[]>(
    () => listSecrets(params),
    [params?.runbookId, params?.environment]
  );
}

/**
 * Hook for creating a secret
 */
export function useCreateSecret() {
  return useApiMutation<{ id: string; name: string }, {
    name: string;
    value: string;
    type: string;
    environment?: string;
    runbookId?: string;
    description?: string;
  }>(createSecret);
}

/**
 * Hook for deleting a secret
 */
export function useDeleteSecret(secretId: string) {
  return useApiMutation<void, void>(
    () => deleteSecret(secretId)
  );
}

/**
 * Hook for fetching schedules for a runbook
 */
export function useRunbookSchedules(runbookId: string) {
  return useApiData<Schedule[]>(
    () => listSchedules(runbookId),
    [runbookId]
  );
}

/**
 * Hook for creating a schedule
 */
export function useCreateSchedule(runbookId: string) {
  return useApiMutation<Schedule, {
    name: string;
    frequency: string;
    cronExpression?: string;
    timezone?: string;
  }>((data) => createSchedule(runbookId, data));
}

/**
 * Hook for deleting a schedule
 */
export function useDeleteSchedule(scheduleId: string) {
  return useApiMutation<void, void>(
    () => deleteSchedule(scheduleId)
  );
}

/**
 * Hook for pausing a schedule
 */
export function usePauseSchedule(scheduleId: string) {
  return useApiMutation<void, void>(
    () => pauseSchedule(scheduleId)
  );
}

/**
 * Hook for resuming a schedule
 */
export function useResumeSchedule(scheduleId: string) {
  return useApiMutation<void, void>(
    () => resumeSchedule(scheduleId)
  );
}
