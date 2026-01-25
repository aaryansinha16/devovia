import { ApiErrorObject, ApiErrorResponse, ApiMeta, ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from "../types/api.types";

function buildMeta(requestId?: string): ApiMeta {
  return {
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {})
  };
}

/* ---------- Success ---------- */

export function successResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: buildMeta(requestId)
  };
}

/* ---------- Paginated ---------- */

export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  requestId?: string
): ApiPaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    message,
    meta: buildMeta(requestId)
  };
}

/* ---------- Error ---------- */

export function errorResponse(
  error: ApiErrorObject,
  requestId?: string
): ApiErrorResponse {
  return {
    success: false,
    error,
    meta: buildMeta(requestId)
  };
}

/* ---------- Shortcut helpers ---------- */

export function validationError(
  message: string,
  details?: unknown,
  field?: string
) {
  return errorResponse({
    code: "VALIDATION_ERROR",
    message,
    details,
    field
  });
}

export function alreadyExistsError(
  message: string
) {
  return errorResponse({
    code: "ALREADY_EXISTS",
    message
  });
}

export function notFoundError(message = "Resource not found") {
  return errorResponse({
    code: "NOT_FOUND",
    message
  });
}

export function internalServerError(details?: unknown) {
  return errorResponse({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
    details
  });
}

export function permissionError(message = "You don't have sufficient permissions") {
  return errorResponse({
    code: "PERMISSION_ERROR",
    message
  });
}