/**
 * Project-specific hooks that wrap the generic API hooks
 * with project service functions for convenience
 */

import { useApiData, usePaginatedData, useApiMutation } from './useApiData';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  type Project,
  type ProjectFormData,
  type ProjectFilters,
} from '../services/projects-service';
import { useCallback } from 'react';

/**
 * Hook for fetching paginated projects with filters
 */
export function useProjects(
  page: number = 1,
  limit: number = 12,
  filters?: ProjectFilters
) {
  const fetcher = useCallback(
    () => getProjects(page, limit, filters),
    [page, limit, filters?.search, filters?.status, filters?.visibility, filters?.myProjects]
  );

  return usePaginatedData<Project>(fetcher, page, limit);
}

/**
 * Hook for fetching a single project by ID
 */
export function useProjectById(id: string) {
  return useApiData<Project>(
    () => getProjectById(id),
    [id]
  );
}

/**
 * Hook for creating a project
 */
export function useCreateProject() {
  return useApiMutation<Project, ProjectFormData>(createProject);
}

/**
 * Hook for updating a project
 */
export function useUpdateProject(id: string) {
  return useApiMutation<Project, Partial<ProjectFormData>>(
    (data) => updateProject(id, data)
  );
}

/**
 * Hook for deleting a project
 */
export function useDeleteProject(id: string) {
  return useApiMutation<void, void>(
    () => deleteProject(id)
  );
}
