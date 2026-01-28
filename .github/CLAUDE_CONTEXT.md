# Devovia Project Context for Claude PR Reviewer

## Project Overview

Devovia is a comprehensive developer collaboration platform built with a modern monorepo architecture. The platform enables real-time collaboration, project management, code snippets, runbooks automation, and blogging capabilities.

**Repository**: https://github.com/[your-org]/devovia
**Tech Stack**: Next.js 15, Node.js/Express, PostgreSQL (Prisma), TypeScript, TailwindCSS
**Package Manager**: pnpm (Turborepo monorepo)

---

## Architecture Overview

### Monorepo Structure

```
devovia/
├── apps/
│   ├── web/              # Next.js 15 frontend application
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities, hooks, services
│   │   └── public/       # Static assets
│   └── api/              # Node.js/Express backend
│       ├── src/
│       │   ├── routes/   # API route handlers
│       │   ├── controllers/ # Business logic
│       │   ├── services/ # Data access layer
│       │   ├── middleware/ # Auth, validation, etc.
│       │   ├── utils/    # Helper functions
│       │   └── types/    # TypeScript definitions
│       └── prisma/       # Database schema & migrations
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Shared Prisma client
│   └── typescript-config/ # Shared TS configs
└── .github/
    └── workflows/        # CI/CD pipelines
```

### Technology Stack

#### Frontend (apps/web)

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Shared component library (@repo/ui)
- **State Management**: React hooks, Context API
- **API Client**: Custom hooks with type-safe extractors
- **Build Tool**: Turbopack (Next.js)

#### Backend (apps/api)

- **Runtime**: Node.js 22.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth
- **Validation**: Zod schemas
- **Real-time**: WebSocket (Yjs for collaboration)
- **Testing**: Vitest

#### Infrastructure

- **Monorepo**: Turborepo for build orchestration
- **Package Manager**: pnpm with workspaces
- **CI/CD**: GitHub Actions
- **Deployment**: Railway (backend), Vercel (frontend)
- **Database**: PostgreSQL on Railway

---

## CRITICAL: API Response Standardization

**⚠️ MOST IMPORTANT PATTERN**: All API responses MUST follow the standardized format.

### Standard Response Types

#### Success Response (Single Item)

```typescript
{
  success: true,
  data: T,
  message?: string,
  meta?: {
    timestamp: string,
    requestId?: string
  }
}
```

#### Paginated Response

```typescript
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
  meta?: {
    timestamp: string
  }
}
```

#### Error Response

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  },
  meta?: {
    timestamp: string
  }
}
```

### Backend Implementation

**✅ CORRECT - Use Response Utilities**:

```typescript
// apps/api/src/utils/response.util.ts
import {
  successResponse,
  paginatedResponse,
  errorResponse,
} from "../utils/response.util";

// Single item
res.json(successResponse(data, "User created successfully"));

// Paginated list
res.json(paginatedResponse(items, paginationMeta, "Items retrieved"));

// Error
res.status(404).json(notFoundError("Resource not found"));
```

**❌ INCORRECT - Direct JSON Response**:

```typescript
// DON'T DO THIS!
res.json({ user: data });
res.json({ items: data, total: count });
res.json({ error: "Not found" });
```

### Frontend Implementation

**✅ CORRECT - Use Type-Safe Extractors**:

```typescript
// apps/web/lib/utils/api-adapter.ts
import { extractData, extractPaginatedData } from "@/lib/utils/api-adapter";

// Extract single item
const user = extractData<User>(response);

// Extract paginated data
const { data: posts, pagination } = extractPaginatedData<Post>(response);
```

**❌ INCORRECT - Direct Property Access**:

```typescript
// DON'T DO THIS!
const user = response.user; // ❌ No type safety
const posts = response.data || response.posts; // ❌ Inconsistent
```

### Custom Hooks Pattern

**✅ CORRECT - Use Centralized Hooks**:

```typescript
// apps/web/lib/hooks/useApiData.ts
import {
  useApiData,
  usePaginatedData,
  useApiMutation,
} from "@/lib/hooks/useApiData";

// Fetch single item
const { data, loading, error } = useApiData(() => getUser(id), [id]);

// Fetch paginated list
const { data, pagination, loading } = usePaginatedData(
  () => getPosts(page, limit),
  page,
  limit,
);

// Mutations
const { mutate, loading } = useApiMutation(createPost);
```

---

## Type Safety Requirements

### TypeScript Configuration

- **Strict Mode**: Enabled across all packages
- **No Implicit Any**: Must explicitly type all variables
- **Strict Null Checks**: Always handle null/undefined
- **No Unused Locals**: Clean up unused imports/variables

### Common Type Patterns

**API Response Types**:

```typescript
// apps/web/lib/types/api.types.ts
import {
  ApiResponse,
  ApiPaginatedResponse,
  PaginationMeta,
} from "@/lib/types/api.types";

// Use centralized types
type UserResponse = ApiResponse<User>;
type PostsResponse = ApiPaginatedResponse<Post>;
```

**Component Props**:

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  // Implementation
}
```

**Service Functions**:

```typescript
// Backend service
export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

// Frontend service
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

---

## Security & Authentication

### Authentication Flow

1. User logs in → Backend generates JWT token
2. Token stored in httpOnly cookie (secure)
3. Frontend includes token in requests automatically
4. Backend validates token via middleware

### Protected Routes Pattern

**Backend**:

```typescript
import { authenticate } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";

router.post(
  "/api/posts",
  authenticate, // ✅ 1. Verify JWT token
  validateRequest(schema), // ✅ 2. Validate input
  controller, // ✅ 3. Business logic
);
```

**Frontend**:

```typescript
// apps/web/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export default async function DashboardLayout({ children }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return <>{children}</>
}
```

### Input Validation

**Always use Zod schemas**:

```typescript
// apps/api/src/validators/user.validator.ts
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  name: z.string().min(1),
});

// In controller
const validated = createUserSchema.parse(req.body);
```

---

## Database Patterns (Prisma)

### Query Best Practices

**✅ CORRECT - Efficient Queries**:

```typescript
// Include relations selectively
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    projects: {
      select: { id: true, title: true }, // Only needed fields
    },
  },
});

// Pagination
const posts = await prisma.post.findMany({
  where: { published: true },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: "desc" },
});

const total = await prisma.post.count({ where: { published: true } });
```

**❌ INCORRECT - N+1 Queries**:

```typescript
// DON'T DO THIS!
const users = await prisma.user.findMany();
for (const user of users) {
  user.projects = await prisma.project.findMany({ where: { userId: user.id } });
}
```

### Schema Conventions

- Use `camelCase` for field names
- Use `PascalCase` for model names
- Always include `id`, `createdAt`, `updatedAt`
- Use proper relations (`@relation`)
- Add indexes for frequently queried fields

---

## Frontend Patterns

### Component Structure

```typescript
'use client'  // Only if using client-side features

import { useState } from 'react'
import { Button, Card } from '@repo/ui'

interface MyComponentProps {
  title: string
  onSubmit: (data: FormData) => void
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Card>
  )
}
```

### Data Fetching Pattern

**Server Components (Preferred)**:

```typescript
// app/posts/page.tsx
import { getPosts } from '@/lib/services/posts'

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

**Client Components (When Needed)**:

```typescript
'use client'

import { useApiData } from '@/lib/hooks/useApiData'
import { getPosts } from '@/lib/services/posts'

export function PostsList() {
  const { data: posts, loading, error } = useApiData(getPosts, [])

  if (loading) return <Loader />
  if (error) return <Error message={error.message} />

  return (
    <div>
      {posts?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

---

## Testing Requirements

### Backend Tests (Vitest)

```typescript
// apps/api/src/routes/__tests__/users.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server";

describe("POST /api/users", () => {
  it("should create a new user", async () => {
    const response = await request(app).post("/api/users").send({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
      name: "Test User",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
  });

  it("should return error for invalid email", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ email: "invalid", username: "test", password: "pass" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### Frontend Tests

```typescript
// apps/web/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)

    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## Common Pitfalls to Avoid

### 🚨 Critical Issues

1. **Not using standardized API responses**

   ```typescript
   // ❌ WRONG
   res.json({ user: data });

   // ✅ CORRECT
   res.json(successResponse(data, "User retrieved"));
   ```

2. **Missing type safety**

   ```typescript
   // ❌ WRONG
   const data: any = await fetchData();

   // ✅ CORRECT
   const data = extractData<User>(await fetchData());
   ```

3. **No error handling**

   ```typescript
   // ❌ WRONG
   const data = await apiCall();

   // ✅ CORRECT
   try {
     const data = await apiCall();
   } catch (error) {
     handleError(error);
   }
   ```

4. **Missing loading states**

   ```typescript
   // ❌ WRONG
   const { data } = useApiData(fetchData)
   return <div>{data.map(...)}</div>

   // ✅ CORRECT
   const { data, loading, error } = useApiData(fetchData)
   if (loading) return <Loader />
   if (error) return <Error />
   return <div>{data?.map(...)}</div>
   ```

### 🟡 Code Quality Issues

5. **Using `any` type unnecessarily**
6. **Not validating input (missing Zod schemas)**
7. **Hardcoded values instead of env variables**
8. **Console.logs in production code**
9. **Missing null checks**
10. **Not using pnpm (using npm/yarn instead)**

---

## Package Management

**ALWAYS use pnpm**:

```bash
# ✅ CORRECT
pnpm add package-name
pnpm add -D dev-package
pnpm install

# ❌ WRONG
npm install package-name
yarn add package-name
```

**Workspace commands**:

```bash
# Install in specific workspace
pnpm add package-name --filter @repo/web

# Run script in workspace
pnpm --filter @repo/api dev

# Run all tests
pnpm test
```

---

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=4000
NODE_ENV="development"
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

**Rules**:

- Never commit `.env` files
- Use `.env.example` for documentation
- Prefix client-side vars with `NEXT_PUBLIC_`
- Validate required env vars on startup

---

## Performance Guidelines

### Database

- ✅ Use indexes on frequently queried fields
- ✅ Use `select` to limit returned fields
- ✅ Implement pagination for large datasets
- ❌ Don't fetch entire tables without limits
- ❌ Don't use N+1 queries

### Frontend

- ✅ Use Server Components when possible
- ✅ Implement proper loading states
- ✅ Use `useMemo` and `useCallback` appropriately
- ❌ Don't fetch data in useEffect unnecessarily
- ❌ Don't create new objects/functions on every render

---

## Review Checklist

When reviewing PRs, verify:

- [ ] API responses use standardized format
- [ ] All code has proper TypeScript types
- [ ] Input validation uses Zod schemas
- [ ] Protected routes have authentication middleware
- [ ] Database queries are efficient (no N+1)
- [ ] Pagination implemented for lists
- [ ] Error handling is comprehensive
- [ ] Loading states exist in UI
- [ ] Tests cover new functionality
- [ ] No console.logs in production code
- [ ] Environment variables used correctly
- [ ] pnpm used for package management
- [ ] Code follows existing patterns

---

## Reference Documentation

- **API Standardization**: `apps/api/API_RESPONSE_STANDARDIZATION.md`
- **Frontend Migration**: `FRONTEND_API_MIGRATION_GUIDE.md`
- **Type Definitions**: `apps/web/lib/types/api.types.ts`
- **Response Utilities**: `apps/api/src/utils/response.util.ts`
- **API Adapters**: `apps/web/lib/utils/api-adapter.ts`
- **Custom Hooks**: `apps/web/lib/hooks/useApiData.ts`

---

**Last Updated**: January 2026
**Maintainer**: Devovia Team
