# Frontend API Response Migration Guide

## Overview
The backend has been standardized to use a unified API response structure. The frontend needs to be updated to handle these new response formats properly.

## Standard Response Format

### Backend Response Structure
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string,
  meta?: { timestamp: string, requestId?: string }
}

// Paginated Response
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  },
  message?: string,
  meta?: { timestamp: string, requestId?: string }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown,
    field?: string
  },
  meta?: { timestamp: string, requestId?: string }
}
```

## Frontend Infrastructure

### ✅ Already in Place
- `@/apps/web/lib/types/api.types.ts` - TypeScript types for API responses
- `@/apps/web/lib/utils/api-client.ts` - Unified API client with `apiRequest()` and `apiRequestPaginated()`
- `@/apps/web/lib/utils/api-adapter.ts` - Helper functions to extract data from responses

### How to Use

**For single-item endpoints:**
```typescript
// Before (legacy)
const response = await apiRequest<{ post: BlogPost }>(`/blogs/${id}`);
return response.post;

// After (if backend returns wrapped data)
const response = await apiRequest<{ post: BlogPost }>(`/blogs/${id}`);
return response.post; // Still works - apiRequest extracts data automatically

// After (if backend returns direct data)
return apiRequest<BlogPost>(`/blogs/${id}`);
```

**For paginated endpoints:**
```typescript
// Before (legacy)
const response = await apiRequest<{ posts: BlogPost[] }>(`/blogs/user`);
return response.posts;

// After (standardized)
return apiRequestPaginated<BlogPost>(`/blogs/user`);
// Returns: { data: BlogPost[], pagination: PaginationMeta }
```

## Fixed Services

### ✅ blog-service.ts
**Fixed:**
- `getUserBlogs()` - Now returns `BlogListResponse` with pagination

**Changes Made:**
```typescript
// Before
export async function getUserBlogs(): Promise<BlogPost[]> {
  const response = await apiRequest<{ posts: BlogPost[] }>(`/blogs/user`);
  return response.posts;
}

// After
export async function getUserBlogs(): Promise<BlogListResponse> {
  return apiRequestPaginated<BlogPost>(`/blogs/user`);
}
```

**Frontend Page Updates:**
```typescript
// Before
const data = await getUserBlogs();
setBlogs(data.posts);

// After
const result = await getUserBlogs();
setBlogs(result.data);
```

## Services That Need Review

### 🔍 runbooks-service.ts
Most endpoints already use `apiRequest<T>()` correctly. Need to verify:
- `listExecutions()` - Returns array, might need pagination
- `listSchedules()` - Returns array, might need pagination
- `listSecrets()` - Returns array, might need pagination

### 🔍 Other Services
Check all service files for:
1. Direct response property access (e.g., `response.posts`, `response.data`)
2. Array returns that should be paginated
3. Wrapped data responses (e.g., `{ post: BlogPost }`)

## Backend Controllers Status

### ✅ Standardized (7/9)
1. runbook.controller.ts
2. runbook-schedules.controller.ts
3. runbook-secrets.controller.ts
4. runbook-approvals.controller.ts
5. git.controller.ts
6. session-execution.controller.ts
7. github-integration.controller.ts

### 🔄 Pending (2/9)
8. session-history.controller.ts
9. ai.controller.ts

### ✅ Already Compliant
- blog.controller.ts (uses `successResponse`, `paginatedResponse`)
- snippet.controller.ts
- project.controller.ts
- auth.controller.ts
- comment.controller.ts
- user.controller.ts

## Migration Checklist

### For Each Service File:
- [ ] Check if using `apiRequest<{ wrapper: T }>` pattern
- [ ] Verify array endpoints use `apiRequestPaginated<T>()`
- [ ] Update return types to match new response structure
- [ ] Test error handling with new error format

### For Each Frontend Page:
- [ ] Update data extraction from service calls
- [ ] Handle pagination metadata if applicable
- [ ] Update error handling to use structured error codes
- [ ] Test loading states and error states

## Common Patterns

### Pattern 1: Wrapped Single Item
```typescript
// Backend returns: successResponse({ post: formattedPost })
// Frontend service:
const response = await apiRequest<{ post: BlogPost }>(`/blogs/${id}`);
return response.post; // apiRequest auto-extracts data
```

### Pattern 2: Direct Single Item
```typescript
// Backend returns: successResponse(runbook)
// Frontend service:
return apiRequest<Runbook>(`/runbooks/${id}`);
```

### Pattern 3: Paginated List
```typescript
// Backend returns: paginatedResponse(items, pagination)
// Frontend service:
return apiRequestPaginated<Item>(`/items`);
// Frontend page:
const { data, pagination } = await getItems();
setItems(data);
```

### Pattern 4: Simple Array (Legacy - should migrate to pagination)
```typescript
// Backend returns: successResponse(items)
// Frontend service:
return apiRequest<Item[]>(`/items`);
```

## Testing

After migration, verify:
1. All list pages load correctly with pagination
2. Single item pages load correctly
3. Create/Update/Delete operations work
4. Error messages display properly
5. Loading states work as expected

## Next Steps

1. ✅ Fix blog-service.ts and blogs dashboard page
2. Review runbooks-service.ts for pagination needs
3. Check all other service files
4. Update remaining frontend pages
5. Test all CRUD operations
6. Document any breaking changes

---

**Last Updated**: 2026-01-28
**Status**: Blog service fixed, other services need review
