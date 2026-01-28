/**
 * Custom React hooks for working with standardized API responses
 * 
 * These hooks simplify state management when working with the new API format
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, ApiPaginatedResponse, PaginationMeta } from '../types/api.types';
import { extractData, extractPaginatedData, createDefaultPagination } from '../utils/api-adapter';
import { PaginatedResult } from '../utils/api-client';

/**
 * Hook for fetching and managing single item API data
 */
export function useApiData<T>(
  fetchFn: () => Promise<ApiResponse<T> | T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFn();
      
      // Handle both old and new format
      if (response && typeof (response as any).success === 'boolean') {
        setData(extractData(response as ApiResponse<T>));
      } else {
        setData(response as T);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook for fetching and managing paginated API data
 * Supports both:
 * - Services returning PaginatedResult<T> (already extracted)
 * - Services returning ApiPaginatedResponse<T> (needs extraction)
 */
export function usePaginatedData<T>(
  fetchFn: () => Promise<PaginatedResult<T> | ApiPaginatedResponse<T>>,
  initialPage: number = 1,
  initialLimit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(
    createDefaultPagination(initialPage, initialLimit)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFn();
      
      // Check if response is already extracted (PaginatedResult) or needs extraction (ApiPaginatedResponse)
      if ('success' in response) {
        // ApiPaginatedResponse - needs extraction
        const { data: items, pagination: paginationMeta } = extractPaginatedData(response as ApiPaginatedResponse<T>);
        setData(items);
        setPagination(paginationMeta);
      } else {
        // PaginatedResult - already extracted
        setData(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for managing API mutations (create, update, delete)
 */
export function useApiMutation<TData, TVariables = void>(
  mutateFn: (variables: TVariables) => Promise<ApiResponse<TData> | TData>
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mutateFn(variables);
      
      // Handle both old and new format
      if (response && typeof (response as any).success === 'boolean') {
        const result = extractData(response as ApiResponse<TData>);
        setData(result);
        return result;
      } else {
        setData(response as TData);
        return response as TData;
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}
