/**
 * Unified API Client
 * 
 * Provides consistent methods for making API requests with proper
 * handling of both single-item and paginated responses.
 * 
 * Usage:
 * - apiRequest<T>() - for single item responses (GET by ID, POST, PUT, DELETE)
 * - apiRequestPaginated<T>() - for paginated list responses (GET lists)
 */

import { API_URL } from '../api-config';
import { getAuthHeaders } from '../services/auth-service';
import {
  ApiResponse,
  ApiPaginatedResponse,
  PaginationMeta,
} from '../types/api.types';
import {
  extractData,
  extractPaginatedData,
  createDefaultPagination,
} from './api-adapter';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Make an API request that returns a single item
 * Use this for: GET by ID, POST, PUT, PATCH, DELETE
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers: customHeaders, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (requiresAuth) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `Request failed with status ${response.status}`);
  }

  // Handle DELETE with no content
  if (method === 'DELETE' && response.status === 204) {
    return undefined as T;
  }

  const apiResponse: ApiResponse<T> = await response.json();
  return extractData(apiResponse);
}

/**
 * Make an API request that returns a paginated list
 * Use this for: GET list endpoints with pagination
 */
export async function apiRequestPaginated<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<PaginatedResult<T>> {
  const { method = 'GET', headers: customHeaders, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (requiresAuth) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `Request failed with status ${response.status}`);
  }

  const apiResponse: ApiPaginatedResponse<T> = await response.json();
  return extractPaginatedData(apiResponse);
}

/**
 * Make an API request without authentication
 * Useful for public endpoints like published blogs
 */
export async function apiRequestPublic<T>(
  endpoint: string,
  options: Omit<RequestOptions, 'requiresAuth'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, requiresAuth: false });
}

/**
 * Make a paginated API request without authentication
 * Useful for public list endpoints
 */
export async function apiRequestPaginatedPublic<T>(
  endpoint: string,
  options: Omit<RequestOptions, 'requiresAuth'> = {}
): Promise<PaginatedResult<T>> {
  return apiRequestPaginated<T>(endpoint, { ...options, requiresAuth: false });
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
