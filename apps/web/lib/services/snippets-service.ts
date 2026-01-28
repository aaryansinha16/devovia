/**
 * Snippets API Service
 * Handles all API calls for the Snippets feature
 */

import {
  apiRequest,
  apiRequestPaginated,
  buildQueryString,
  PaginatedResult,
} from '../utils/api-client';

// Types
export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE' | 'TEAM_ONLY';
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  _count?: {
    likes?: number;
    views?: number;
  };
}

export interface SnippetFormData {
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  visibility?: string;
}

export interface SnippetFilters {
  search?: string;
  language?: string;
  tag?: string;
}

/**
 * Fetch all snippets with optional filters
 */
export async function getSnippets(
  page: number = 1,
  limit: number = 20,
  filters?: SnippetFilters
): Promise<PaginatedResult<Snippet>> {
  const query = buildQueryString({
    page,
    limit,
    search: filters?.search,
    language: filters?.language !== 'all' ? filters?.language : undefined,
    tag: filters?.tag !== 'all' ? filters?.tag : undefined,
  });

  return apiRequestPaginated<Snippet>(`/snippets${query}`);
}

/**
 * Fetch a single snippet by ID
 */
export async function getSnippetById(id: string): Promise<Snippet> {
  return apiRequest<Snippet>(`/snippets/${id}`);
}

/**
 * Create a new snippet
 */
export async function createSnippet(snippetData: SnippetFormData): Promise<Snippet> {
  return apiRequest<Snippet>('/snippets', {
    method: 'POST',
    body: snippetData,
  });
}

/**
 * Update an existing snippet
 */
export async function updateSnippet(
  id: string,
  snippetData: Partial<SnippetFormData>
): Promise<Snippet> {
  return apiRequest<Snippet>(`/snippets/${id}`, {
    method: 'PUT',
    body: snippetData,
  });
}

/**
 * Delete a snippet
 */
export async function deleteSnippet(id: string): Promise<void> {
  return apiRequest<void>(`/snippets/${id}`, {
    method: 'DELETE',
  });
}
