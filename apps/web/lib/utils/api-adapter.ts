/**
 * API Response Adapter Utilities
 * 
 * Helper functions to safely extract data from standardized API responses
 * and handle errors gracefully.
 */

import {
  ApiResponse,
  ApiPaginatedResponse,
  ApiErrorResponse,
  isApiSuccess,
  isApiPaginatedSuccess,
  isApiError,
  PaginationMeta,
} from '../types/api.types';

/**
 * Extract data from a single-item API response
 * Throws an error if the response indicates failure
 */
export function extractData<T>(response: ApiResponse<T> | ApiErrorResponse): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  
  throw new Error(response.error.message || 'API request failed');
}

/**
 * Extract data from a paginated API response
 * Throws an error if the response indicates failure
 */
export function extractPaginatedData<T>(
  response: ApiPaginatedResponse<T> | ApiErrorResponse
): { data: T[]; pagination: PaginationMeta } {
  if (isApiPaginatedSuccess(response)) {
    return {
      data: response.data,
      pagination: response.pagination,
    };
  }
  
  throw new Error(response.error.message || 'API request failed');
}

/**
 * Safely extract data with a fallback value
 */
export function extractDataSafe<T>(
  response: ApiResponse<T> | ApiErrorResponse,
  fallback: T
): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  
  console.error('API Error:', response.error);
  return fallback;
}

/**
 * Safely extract paginated data with fallback
 */
export function extractPaginatedDataSafe<T>(
  response: ApiPaginatedResponse<T> | ApiErrorResponse,
  fallback: { data: T[]; pagination: PaginationMeta }
): { data: T[]; pagination: PaginationMeta } {
  if (isApiPaginatedSuccess(response)) {
    return {
      data: response.data,
      pagination: response.pagination,
    };
  }
  
  console.error('API Error:', response.error);
  return fallback;
}

/**
 * Get error message from API response
 */
export function getErrorMessage(
  response: ApiResponse<any> | ApiPaginatedResponse<any> | ApiErrorResponse,
  defaultMessage: string = 'An error occurred'
): string {
  if (isApiError(response)) {
    return response.error.message || defaultMessage;
  }
  return defaultMessage;
}

/**
 * Create a default pagination object
 */
export function createDefaultPagination(
  page: number = 1,
  limit: number = 20
): PaginationMeta {
  return {
    page,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
}

/**
 * Transform legacy response to new format (for gradual migration)
 * Use this temporarily if you need to support both old and new formats
 */
export function normalizeLegacyResponse<T>(response: any): ApiResponse<T> {
  // If already in new format
  if (response && typeof response.success === 'boolean') {
    return response;
  }
  
  // Transform legacy format
  return {
    success: true,
    data: response,
    message: 'Success',
  };
}

/**
 * Transform legacy paginated response to new format
 */
export function normalizeLegacyPaginatedResponse<T>(response: any): ApiPaginatedResponse<T> {
  // If already in new format
  if (response && typeof response.success === 'boolean' && response.pagination) {
    return response;
  }
  
  // Transform legacy format (common patterns)
  if (response && Array.isArray(response.data || response.items || response.results)) {
    const data = response.data || response.items || response.results;
    const total = response.total || response.count || data.length;
    const page = response.page || 1;
    const limit = response.limit || response.pageSize || 20;
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: 'Success',
    };
  }
  
  // Fallback
  return {
    success: true,
    data: [],
    pagination: createDefaultPagination(),
    message: 'Success',
  };
}
