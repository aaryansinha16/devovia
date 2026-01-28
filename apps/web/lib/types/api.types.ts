/**
 * Centralized API Response Types
 * 
 * All backend API responses follow this standardized format.
 * Use these types throughout the frontend for type safety.
 */

/**
 * Pagination metadata returned by list endpoints
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  timestamp: string;
}

/**
 * Error details in error responses
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Standard success response for single items
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Standard success response for paginated lists
 */
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Standard error response
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  meta?: ResponseMeta;
}

/**
 * Union type for all possible API responses
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
export type ApiPaginatedResult<T> = ApiPaginatedResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T> | ApiErrorResponse
): response is ApiResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if paginated response is successful
 */
export function isApiPaginatedSuccess<T>(
  response: ApiPaginatedResponse<T> | ApiErrorResponse
): response is ApiPaginatedResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(
  response: ApiResponse<any> | ApiPaginatedResponse<any> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}
