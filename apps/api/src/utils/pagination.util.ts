import { PaginationMeta } from '../types/api.types';

export interface PaginationInput {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export function normalizePagination({
  page = 1,
  limit = 20,
  maxLimit = 100,
}: PaginationInput) {
  const safeLimit = Math.min(Math.max(limit, 1), maxLimit);
  const safePage = Math.max(page, 1);

  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset,
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
