export interface ApiMeta {
  timestamp: string;
  requestId?: string;
}

/* ---------- Success Responses ---------- */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: ApiMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  meta?: ApiMeta;
}

/* ---------- Error Responses ---------- */

export interface ApiErrorObject {
  code: string;
  message: string;
  details?: unknown;
  field?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorObject;
  meta?: ApiMeta;
}

/* ---------- Union ---------- */

export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiPaginatedResponse<T>
  | ApiErrorResponse;

/* ---------- Query Params ---------- */

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string

  // dynamic filters
  [key: string]: any;
}
