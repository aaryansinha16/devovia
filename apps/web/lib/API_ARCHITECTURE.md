# Frontend API Architecture

## Overview

This document describes the consistent API architecture used across all frontend services and hooks.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                            │
│  (pages, components that consume data)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Feature Hooks                             │
│  useProjects, useSnippets, useRunbooks, useBlogs            │
│  (React state management, caching, refetch)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Generic Hooks                              │
│  useApiData, usePaginatedData, useApiMutation               │
│  (Generic state management patterns)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Feature Services                            │
│  projects-service, snippets-service, runbooks-service       │
│  (API endpoint definitions, business logic)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Unified API Client                          │
│  apiRequest, apiRequestPaginated                            │
│  (HTTP requests, auth headers, response extraction)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Types                                 │
│  ApiResponse<T>, ApiPaginatedResponse<T>, PaginationMeta    │
│  (Type definitions for API responses)                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Files

### 1. Unified API Client (`/lib/utils/api-client.ts`)

The central HTTP client that handles all API requests:

```typescript
// For single-item responses (GET by ID, POST, PUT, DELETE)
apiRequest<T>(endpoint, options): Promise<T>

// For paginated list responses
apiRequestPaginated<T>(endpoint, options): Promise<PaginatedResult<T>>

// Public endpoints (no auth required)
apiRequestPublic<T>(endpoint, options): Promise<T>
apiRequestPaginatedPublic<T>(endpoint, options): Promise<PaginatedResult<T>>

// Helper for building query strings
buildQueryString(params): string
```

### 2. API Types (`/lib/types/api.types.ts`)

Standardized response types:

```typescript
// Single item response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Paginated list response
interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

// Pagination metadata
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### 3. Generic Hooks (`/lib/hooks/useApiData.ts`)

```typescript
// For fetching single items
useApiData<T>(fetchFn, deps): { data, loading, error, refetch }

// For fetching paginated lists
usePaginatedData<T>(fetchFn, page, limit): { data, pagination, loading, error, refetch }

// For mutations (create, update, delete)
useApiMutation<TData, TVariables>(mutateFn): { data, loading, error, mutate, reset }
```

## Service Pattern

All services follow this consistent pattern:

```typescript
// /lib/services/[feature]-service.ts

import {
  apiRequest,
  apiRequestPaginated,
  buildQueryString,
  PaginatedResult,
} from '../utils/api-client';

// Types
export interface Feature { ... }
export interface FeatureFormData { ... }
export interface FeatureFilters { ... }

// List (paginated)
export async function getFeatures(
  page: number,
  limit: number,
  filters?: FeatureFilters
): Promise<PaginatedResult<Feature>> {
  const query = buildQueryString({ page, limit, ...filters });
  return apiRequestPaginated<Feature>(`/features${query}`);
}

// Get by ID
export async function getFeatureById(id: string): Promise<Feature> {
  return apiRequest<Feature>(`/features/${id}`);
}

// Create
export async function createFeature(data: FeatureFormData): Promise<Feature> {
  return apiRequest<Feature>('/features', {
    method: 'POST',
    body: data,
  });
}

// Update
export async function updateFeature(id: string, data: Partial<FeatureFormData>): Promise<Feature> {
  return apiRequest<Feature>(`/features/${id}`, {
    method: 'PUT',
    body: data,
  });
}

// Delete
export async function deleteFeature(id: string): Promise<void> {
  return apiRequest<void>(`/features/${id}`, {
    method: 'DELETE',
  });
}
```

## Hook Pattern

All feature hooks follow this consistent pattern:

```typescript
// /lib/hooks/use[Feature].ts

import { useApiData, usePaginatedData, useApiMutation } from './useApiData';
import { getFeatures, getFeatureById, createFeature, updateFeature, deleteFeature } from '../services/[feature]-service';
import { useCallback } from 'react';

// List hook
export function useFeatures(page = 1, limit = 20, filters?: Filters) {
  const fetcher = useCallback(
    () => getFeatures(page, limit, filters),
    [page, limit, /* filter dependencies */]
  );
  return usePaginatedData<Feature>(fetcher, page, limit);
}

// Single item hook
export function useFeatureById(id: string) {
  return useApiData<Feature>(() => getFeatureById(id), [id]);
}

// Mutation hooks
export function useCreateFeature() {
  return useApiMutation<Feature, FeatureFormData>(createFeature);
}

export function useUpdateFeature(id: string) {
  return useApiMutation<Feature, Partial<FeatureFormData>>(
    (data) => updateFeature(id, data)
  );
}

export function useDeleteFeature(id: string) {
  return useApiMutation<void, void>(() => deleteFeature(id));
}
```

## Component Usage

### Using List Hooks

```tsx
function FeatureListPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  
  const { data: features = [], pagination, loading, error, refetch } = useFeatures(page, 20, filters);

  if (loading) return <Loader />;
  if (error) return <Error message={error.message} onRetry={refetch} />;

  return (
    <div>
      {features.map(feature => <FeatureCard key={feature.id} feature={feature} />)}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
```

### Using Mutation Hooks

```tsx
function CreateFeaturePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: createFeature, loading } = useCreateFeature();

  const handleSubmit = async (data: FeatureFormData) => {
    try {
      const feature = await createFeature(data);
      toast({ title: "Success!", description: "Feature created" });
      router.push(`/features/${feature.id}`);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return <FeatureForm onSubmit={handleSubmit} loading={loading} />;
}
```

### Using Service Functions Directly (for event handlers)

```tsx
function FeatureDetailPage() {
  const { id } = useParams();
  const { data: feature, loading, refetch } = useFeatureById(id);
  const { toast } = useToast();

  // Use service function directly for event handlers
  const handleDelete = async () => {
    if (!confirm("Delete this feature?")) return;
    
    try {
      await deleteFeature(id); // Direct service call
      toast({ title: "Deleted!" });
      router.push('/features');
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <FeatureDetails feature={feature} />
      <Button onClick={handleDelete}>Delete</Button>
    </div>
  );
}
```

## Important Rules

### 1. Never call hooks inside event handlers

❌ **Wrong:**
```tsx
const handleDelete = async () => {
  const { mutate } = useDeleteFeature(id); // INVALID - hooks can't be called here
  await mutate();
};
```

✅ **Correct:**
```tsx
// Option 1: Use service function directly
const handleDelete = async () => {
  await deleteFeature(id);
};

// Option 2: Use hook at component level
const { mutate: deleteItem } = useDeleteFeature(id);
const handleDelete = async () => {
  await deleteItem();
};
```

### 2. Always use the unified API client in services

❌ **Wrong:**
```tsx
const response = await fetch(`${API_URL}/features`);
const data = await response.json();
return extractData(data);
```

✅ **Correct:**
```tsx
return apiRequest<Feature[]>('/features');
```

### 3. Use appropriate method for response type

- `apiRequest<T>()` - Single items (GET by ID, POST, PUT, DELETE)
- `apiRequestPaginated<T>()` - Paginated lists (GET with pagination)

### 4. Pass objects to body, not JSON strings

❌ **Wrong:**
```tsx
apiRequest('/features', { method: 'POST', body: JSON.stringify(data) });
```

✅ **Correct:**
```tsx
apiRequest('/features', { method: 'POST', body: data });
```

## Services Overview

| Service | File | Endpoints |
|---------|------|-----------|
| Projects | `projects-service.ts` | CRUD for projects |
| Snippets | `snippets-service.ts` | CRUD for code snippets |
| Runbooks | `runbooks-service.ts` | CRUD + executions, approvals, secrets, schedules |
| Blogs | `blog-service.ts` | CRUD for blog posts (authenticated) |
| Public Blogs | `public-blog-service.ts` | Public blog endpoints + likes/comments |

## Response Handling

The unified API client automatically:
1. Adds authentication headers (unless `requiresAuth: false`)
2. Handles JSON serialization of request body
3. Extracts data from standardized API responses
4. Throws errors with meaningful messages on failure
5. Handles DELETE with 204 No Content responses

## Error Handling

All errors are thrown as `Error` objects with descriptive messages:

```typescript
try {
  const data = await apiRequest('/features');
} catch (error) {
  // error.message contains the API error message
  console.error(error.message);
}
```

## Migration Notes

When migrating existing code:

1. Replace manual `fetch` calls with `apiRequest` or `apiRequestPaginated`
2. Remove manual `extractData`/`extractPaginatedData` calls (handled by client)
3. Update hook fetchers to use the new signature (no page/limit params in callback)
4. Update delete mutations to return `void` instead of `{ message: string }`
5. Remove `JSON.stringify` from body parameters
