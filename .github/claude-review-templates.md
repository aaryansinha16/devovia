# Claude PR Review Templates

This document provides structured templates for consistent, high-quality PR review feedback.

---

## 🔒 Security Issues

### Template: Missing Authentication

````markdown
**Security Issue**: Endpoint missing authentication middleware

**Suggestion**: Add authentication middleware to protect this route

**Example**:

```typescript
// Instead of:
router.post("/api/resource", controller);

// Use:
import { authenticate } from "../middleware/auth.middleware";
router.post("/api/resource", authenticate, controller);
```
````

**Reason**: Unauthenticated endpoints expose sensitive operations to unauthorized access.

````

### Template: Missing Input Validation
```markdown
**Security Issue**: No input validation on user-provided data

**Suggestion**: Add Zod schema validation

**Example**:
```typescript
import { z } from 'zod'
import { validateRequest } from '../middleware/validation.middleware'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
})

router.post('/api/users',
  authenticate,
  validateRequest(schema),
  controller
)
````

**Reason**: Unvalidated input can lead to injection attacks and data corruption.

````

### Template: Sensitive Data Exposure
```markdown
**Security Issue**: Sensitive data exposed in API response

**Suggestion**: Remove sensitive fields from response or use select projection

**Example**:
```typescript
// Instead of:
const user = await prisma.user.findUnique({ where: { id } })

// Use:
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    // Don't include: password, resetToken, etc.
  }
})
````

**Reason**: Exposing sensitive data like passwords or tokens creates security vulnerabilities.

````

---

## 📊 API Standardization Issues

### Template: Non-Standard Response Format
```markdown
**API Standardization Issue**: Response not using standardized format

**Suggestion**: Use response utilities from `utils/response.util.ts`

**Example**:
```typescript
// Instead of:
res.json({ user: data })

// Use:
import { successResponse } from '../utils/response.util'
res.json(successResponse(data, 'User retrieved successfully'))
````

**Reason**: Consistent response format ensures type safety and easier frontend integration.

**Reference**: See `apps/api/API_RESPONSE_STANDARDIZATION.md`

````

### Template: Missing Pagination
```markdown
**API Standardization Issue**: List endpoint missing pagination

**Suggestion**: Implement pagination using `paginatedResponse` utility

**Example**:
```typescript
import { paginatedResponse } from '../utils/response.util'
import { normalizePagination, buildPaginationMeta } from '../utils/pagination.util'

const { page, limit, offset } = normalizePagination({
  page: Number(req.query.page),
  limit: Number(req.query.limit)
})

const [items, total] = await Promise.all([
  prisma.post.findMany({ skip: offset, take: limit }),
  prisma.post.count()
])

const pagination = buildPaginationMeta(page, limit, total)
res.json(paginatedResponse(items, pagination, 'Posts retrieved'))
````

**Reason**: Pagination prevents performance issues and memory exhaustion with large datasets.

````

### Template: Incorrect Error Response
```markdown
**API Standardization Issue**: Error response not using standard format

**Suggestion**: Use error response utilities

**Example**:
```typescript
// Instead of:
res.status(404).json({ error: 'Not found' })

// Use:
import { notFoundError } from '../utils/response.util'
res.status(404).json(notFoundError('Resource not found'))
````

**Reason**: Standard error format enables consistent error handling on frontend.

````

---

## 🎯 Type Safety Issues

### Template: Using `any` Type
```markdown
**Type Safety Issue**: Using `any` type reduces type safety

**Suggestion**: Define proper TypeScript interface or type

**Example**:
```typescript
// Instead of:
const data: any = await fetchData()

// Use:
interface User {
  id: string
  name: string
  email: string
}

const data: User = await fetchData()
````

**Reason**: Explicit types catch errors at compile time and improve code maintainability.

````

### Template: Missing Type Definitions
```markdown
**Type Safety Issue**: Function missing return type annotation

**Suggestion**: Add explicit return type

**Example**:
```typescript
// Instead of:
async function getUser(id: string) {
  return await prisma.user.findUnique({ where: { id } })
}

// Use:
async function getUser(id: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id } })
}
````

**Reason**: Explicit return types prevent type inference errors and improve IDE support.

````

### Template: Not Using Centralized Types
```markdown
**Type Safety Issue**: Not using centralized API response types

**Suggestion**: Import types from `lib/types/api.types.ts`

**Example**:
```typescript
// Instead of:
interface Response {
  success: boolean
  data: User
}

// Use:
import { ApiResponse } from '@/lib/types/api.types'
type UserResponse = ApiResponse<User>
````

**Reason**: Centralized types ensure consistency across the application.

````

---

## 🏗️ Code Quality Issues

### Template: DRY Violation
```markdown
**Code Quality Issue**: Duplicate code violates DRY principle

**Suggestion**: Extract common logic into reusable function

**Example**:
```typescript
// Instead of duplicating:
const user1 = await prisma.user.findUnique({ where: { id: id1 }, select: { id: true, name: true } })
const user2 = await prisma.user.findUnique({ where: { id: id2 }, select: { id: true, name: true } })

// Extract to function:
async function getUserBasicInfo(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true }
  })
}

const user1 = await getUserBasicInfo(id1)
const user2 = await getUserBasicInfo(id2)
````

**Reason**: Reduces code duplication and makes maintenance easier.

````

### Template: Missing Error Handling
```markdown
**Code Quality Issue**: Missing error handling for async operation

**Suggestion**: Add try-catch block or error boundary

**Example**:
```typescript
// Instead of:
const data = await apiCall()

// Use:
try {
  const data = await apiCall()
  // Handle success
} catch (error) {
  console.error('API call failed:', error)
  // Handle error appropriately
}
````

**Reason**: Unhandled errors can crash the application or leave it in inconsistent state.

````

### Template: Hardcoded Values
```markdown
**Code Quality Issue**: Hardcoded value should be in environment variable

**Suggestion**: Move to environment variable

**Example**:
```typescript
// Instead of:
const apiUrl = 'http://localhost:4000'

// Use:
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
````

**Reason**: Environment variables enable different configurations per environment.

````

---

## 🧪 Testing Issues

### Template: Missing Tests
```markdown
**Testing Issue**: New functionality missing test coverage

**Suggestion**: Add unit tests for the new function

**Example**:
```typescript
// In __tests__/user.test.ts
import { describe, it, expect } from 'vitest'
import { getUserById } from '../user.service'

describe('getUserById', () => {
  it('should return user when found', async () => {
    const user = await getUserById('valid-id')
    expect(user).toBeDefined()
    expect(user.id).toBe('valid-id')
  })

  it('should throw error when user not found', async () => {
    await expect(getUserById('invalid-id')).rejects.toThrow('User not found')
  })
})
````

**Reason**: Tests prevent regressions and document expected behavior.

````

### Template: Missing Edge Case Tests
```markdown
**Testing Issue**: Tests don't cover edge cases

**Suggestion**: Add tests for error conditions and boundary cases

**Example**:
```typescript
describe('createUser', () => {
  it('should handle duplicate email', async () => {
    await createUser({ email: 'test@example.com', name: 'Test' })
    await expect(
      createUser({ email: 'test@example.com', name: 'Test2' })
    ).rejects.toThrow('Email already exists')
  })

  it('should validate email format', async () => {
    await expect(
      createUser({ email: 'invalid', name: 'Test' })
    ).rejects.toThrow('Invalid email')
  })
})
````

**Reason**: Edge cases often reveal bugs that normal flow testing misses.

````

---

## ⚡ Performance Issues

### Template: N+1 Query Problem
```markdown
**Performance Issue**: N+1 query problem detected

**Suggestion**: Use Prisma's `include` or batch queries

**Example**:
```typescript
// Instead of:
const users = await prisma.user.findMany()
for (const user of users) {
  user.posts = await prisma.post.findMany({ where: { userId: user.id } })
}

// Use:
const users = await prisma.user.findMany({
  include: {
    posts: true
  }
})
````

**Reason**: N+1 queries cause severe performance degradation with large datasets.

````

### Template: Missing Pagination
```markdown
**Performance Issue**: Fetching all records without pagination

**Suggestion**: Implement pagination to limit result set

**Example**:
```typescript
// Instead of:
const posts = await prisma.post.findMany()

// Use:
const page = Number(req.query.page) || 1
const limit = Number(req.query.limit) || 20
const skip = (page - 1) * limit

const posts = await prisma.post.findMany({
  skip,
  take: limit,
  orderBy: { createdAt: 'desc' }
})
````

**Reason**: Loading all records can cause memory issues and slow response times.

````

### Template: Inefficient React Rendering
```markdown
**Performance Issue**: Component re-renders unnecessarily

**Suggestion**: Use `useMemo` or `useCallback` to optimize

**Example**:
```typescript
// Instead of:
function MyComponent({ items }) {
  const filtered = items.filter(item => item.active)

  return <List items={filtered} />
}

// Use:
import { useMemo } from 'react'

function MyComponent({ items }) {
  const filtered = useMemo(
    () => items.filter(item => item.active),
    [items]
  )

  return <List items={filtered} />
}
````

**Reason**: Prevents expensive computations on every render.

````

---

## 📦 Package Management Issues

### Template: Wrong Package Manager
```markdown
**Package Management Issue**: Using npm/yarn instead of pnpm

**Suggestion**: Use pnpm for all package operations

**Example**:
```bash
# Instead of:
npm install package-name
yarn add package-name

# Use:
pnpm add package-name
pnpm add -D dev-package
````

**Reason**: Project uses pnpm for consistent dependency management and workspace support.

````

### Template: Direct Dependency in Wrong Workspace
```markdown
**Package Management Issue**: Dependency added to wrong workspace

**Suggestion**: Use workspace filter to add to correct package

**Example**:
```bash
# Instead of adding to root:
pnpm add package-name

# Add to specific workspace:
pnpm add package-name --filter @repo/web
pnpm add package-name --filter @repo/api
````

**Reason**: Dependencies should be in the workspace that uses them.

````

---

## 🎨 UI/UX Issues

### Template: Missing Loading State
```markdown
**UI/UX Issue**: No loading state while fetching data

**Suggestion**: Add loading indicator

**Example**:
```typescript
function MyComponent() {
  const { data, loading, error } = useApiData(fetchData)

  if (loading) return <Loader />
  if (error) return <Error message={error.message} />

  return <div>{data?.map(...)}</div>
}
````

**Reason**: Users need feedback during async operations.

````

### Template: Missing Error State
```markdown
**UI/UX Issue**: No error handling in UI

**Suggestion**: Add error boundary or error display

**Example**:
```typescript
function MyComponent() {
  const { data, loading, error } = useApiData(fetchData)

  if (loading) return <Loader />
  if (error) {
    return (
      <div className="error">
        <p>Failed to load data: {error.message}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    )
  }

  return <div>{data?.map(...)}</div>
}
````

**Reason**: Users need to know when something goes wrong and how to recover.

```

---

## Quick Reference

### Severity Levels
- 🔒 **Critical**: Security vulnerabilities, data exposure
- 📊 **High**: API standardization, type safety
- 🏗️ **Medium**: Code quality, maintainability
- ⚡ **Low**: Performance optimizations, minor improvements

### Review Priority
1. Security issues (fix immediately)
2. API standardization (required for consistency)
3. Type safety (prevents runtime errors)
4. Testing (ensures quality)
5. Performance (improves UX)
6. Code quality (long-term maintainability)

---

**Usage**: Copy the relevant template, fill in specific details, and post as inline comment on the PR.
```
