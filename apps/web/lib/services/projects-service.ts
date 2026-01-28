/**
 * Projects API Service
 * Handles all API calls for the Projects feature
 */

import {
  apiRequest,
  apiRequestPaginated,
  buildQueryString,
  PaginatedResult,
} from '../utils/api-client';

// Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'TEAM_ONLY';
  thumbnail?: string;
  githubUrl?: string;
  liveUrl?: string;
  techStack: string[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  members?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }>;
  _count?: {
    links?: number;
    members?: number;
  };
}

export interface ProjectFormData {
  title: string;
  description?: string;
  status?: string;
  visibility?: string;
  thumbnail?: string;
  githubUrl?: string;
  liveUrl?: string;
  techStack?: string[];
  startDate?: string;
  endDate?: string;
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  visibility?: string;
  myProjects?: boolean;
}

/**
 * Fetch all projects with optional filters
 */
export async function getProjects(
  page: number = 1,
  limit: number = 12,
  filters?: ProjectFilters
): Promise<PaginatedResult<Project>> {
  const query = buildQueryString({
    page,
    limit,
    search: filters?.search,
    status: filters?.status !== 'all' ? filters?.status : undefined,
    visibility: filters?.visibility !== 'all' ? filters?.visibility : undefined,
    myProjects: filters?.myProjects ? 'true' : undefined,
  });

  return apiRequestPaginated<Project>(`/projects${query}`);
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`);
}

/**
 * Create a new project
 */
export async function createProject(projectData: ProjectFormData): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: projectData,
  });
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  projectData: Partial<ProjectFormData>
): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: projectData,
  });
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}
