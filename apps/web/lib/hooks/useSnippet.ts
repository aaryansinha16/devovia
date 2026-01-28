/**
 * Snippet-specific hooks that wrap the generic API hooks
 * with snippet service functions for convenience
 */

import { useApiData, usePaginatedData, useApiMutation } from './useApiData';
import {
  getSnippets,
  getSnippetById,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  type Snippet,
  type SnippetFormData,
  type SnippetFilters,
} from '../services/snippets-service';
import { useCallback } from 'react';

/**
 * Hook for fetching paginated snippets with filters
 */
export function useSnippets(
  page: number = 1,
  limit: number = 20,
  filters?: SnippetFilters
) {
  const fetcher = useCallback(
    () => getSnippets(page, limit, filters),
    [page, limit, filters?.search, filters?.language, filters?.tag]
  );

  return usePaginatedData<Snippet>(fetcher, page, limit);
}

/**
 * Hook for fetching a single snippet by ID
 */
export function useSnippetById(id: string) {
  return useApiData<Snippet>(
    () => getSnippetById(id),
    [id]
  );
}

/**
 * Hook for creating a snippet
 */
export function useCreateSnippet() {
  return useApiMutation<Snippet, SnippetFormData>(createSnippet);
}

/**
 * Hook for updating a snippet
 */
export function useUpdateSnippet(id: string) {
  return useApiMutation<Snippet, Partial<SnippetFormData>>(
    (data) => updateSnippet(id, data)
  );
}

/**
 * Hook for deleting a snippet
 */
export function useDeleteSnippet(id: string) {
  return useApiMutation<void, void>(
    () => deleteSnippet(id)
  );
}
