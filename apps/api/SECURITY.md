# Security Implementation Guide

This document outlines the security measures implemented in the deployment feature and how to use them properly.

## 🔐 Access Token Encryption

### Overview
All platform access tokens (Vercel, Netlify, etc.) are encrypted before being stored in the database using AES-256-GCM encryption with PBKDF2 key derivation.

### Setup
1. Generate a strong encryption key (minimum 32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Add to your `.env` file:
```env
ENCRYPTION_KEY=your_generated_key_here
```

### Usage
The encryption is handled automatically by the `DeploymentService`:

```typescript
// Tokens are encrypted when creating connections
await deploymentService.createConnection(userId, {
  platform: 'VERCEL',
  accessToken: 'plain_text_token', // Automatically encrypted
  // ...
});

// Tokens are decrypted only when needed internally
const token = await deploymentService.getDecryptedAccessToken(connectionId, userId);
```

### Important Notes
- **Never** log decrypted tokens
- **Never** send decrypted tokens to the frontend
- Tokens are masked when returned to clients (e.g., `***xyz123`)
- Encryption key must be kept secret and backed up securely

## 🛡️ Input Validation

### Overview
All API endpoints use Zod schemas for request validation to prevent injection attacks and ensure data integrity.

### Available Schemas
Located in `src/validators/deployment.validator.ts`:

- `createConnectionSchema` - Validate new platform connections
- `createSiteSchema` - Validate new site creation
- `createDeploymentSchema` - Validate deployment creation
- `deploymentListQuerySchema` - Validate query parameters
- And more...

### Usage in Routes
```typescript
import { validateRequest } from '../middleware/validation.middleware';
import { createConnectionSchema } from '../validators/deployment.validator';

router.post('/connections',
  authenticateJWT,
  validateRequest(createConnectionSchema),
  createConnection
);
```

### Error Response Format
```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": "accessToken",
      "message": "String must contain at least 10 character(s)"
    }
  ]
}
```

## 🚦 Rate Limiting

### Overview
Rate limiting protects endpoints from abuse and DDoS attacks.

### Available Rate Limiters
Located in `src/middleware/rate-limit.middleware.ts`:

1. **apiRateLimiter** - General API endpoints
   - 100 requests per 15 minutes

2. **authRateLimiter** - Authentication endpoints
   - 5 requests per 15 minutes

3. **webhookRateLimiter** - Webhook endpoints
   - 100 requests per 15 minutes

4. **syncRateLimiter** - Sync operations
   - 10 requests per 5 minutes

5. **aiRateLimiter** - AI analysis operations
   - 20 requests per hour

### Usage
```typescript
import { webhookRateLimiter } from '../middleware/rate-limit.middleware';

router.post('/webhooks/github', webhookRateLimiter, handleGitHubWebhook);
```

### Rate Limit Headers
Responses include standard rate limit headers:
- `RateLimit-Limit` - Request limit
- `RateLimit-Remaining` - Remaining requests
- `RateLimit-Reset` - Reset timestamp

## 📝 Standardized Error Handling

### Overview
All errors use standardized response utilities for consistency.

### Available Error Helpers
Located in `src/utils/response.util.ts`:

```typescript
// 400 Bad Request
badRequestError('Invalid input', { field: 'email' })

// 401 Unauthorized
unauthorizedError('Authentication required')

// 403 Forbidden
permissionError('Insufficient permissions')

// 404 Not Found
notFoundError('Resource not found')

// 409 Conflict
alreadyExistsError('Resource already exists')

// 422 Validation Error
validationError('Invalid email format', details, 'email')

// 500 Internal Server Error
internalServerError(error)
```

### Response Format
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input",
    "details": { "field": "email" }
  },
  "meta": {
    "timestamp": "2024-01-31T00:00:00.000Z"
  }
}
```

## 🔍 Database Query Optimization

### Indexes
Compound indexes have been added for common query patterns:

```prisma
model Deployment {
  // ...
  @@index([siteId, status, createdAt]) // For filtered lists
  @@index([status, environment, createdAt]) // For dashboard queries
  @@index([triggeredBy, createdAt]) // For user activity
}
```

### N+1 Query Prevention
Use aggregation queries instead of multiple queries:

```typescript
// ❌ Bad - N+1 queries
const deployments = await db.deployment.findMany();
for (const deployment of deployments) {
  const site = await db.site.findUnique({ where: { id: deployment.siteId } });
}

// ✅ Good - Single query with include
const deployments = await db.deployment.findMany({
  include: { site: true }
});
```

## 🏗️ Service Layer Architecture

### Overview
Business logic is separated from controllers into service classes for better maintainability and testability.

### Structure
```
controllers/     # HTTP request/response handling
  └─ deployment.controller.ts
services/        # Business logic
  └─ deployment.service.ts
validators/      # Input validation schemas
  └─ deployment.validator.ts
```

### Example
```typescript
// Controller - thin layer
export async function createConnection(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(unauthorizedError());
    }

    const result = await deploymentService.createConnection(userId, req.body);
    res.status(201).json(successResponse(result));
  } catch (error: any) {
    res.status(400).json(badRequestError(error.message));
  }
}

// Service - business logic
class DeploymentService {
  async createConnection(userId: string, data: CreateConnectionInput) {
    // Validation, encryption, database operations
    // ...
  }
}
```

## 🔒 Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use `.env.example` as a template
- Rotate encryption keys periodically
- Use different keys for different environments

### 2. Token Management
- Encrypt all sensitive tokens
- Implement token rotation where possible
- Set appropriate token expiration times
- Revoke tokens when connections are deleted

### 3. API Security
- Always validate input with Zod schemas
- Apply appropriate rate limiting
- Use HTTPS in production
- Implement CORS properly
- Log security events

### 4. Database Security
- Use parameterized queries (Prisma handles this)
- Implement proper indexes
- Regular backups
- Monitor query performance

### 5. Error Handling
- Never expose sensitive information in errors
- Use standardized error responses
- Log errors for monitoring
- Implement proper error boundaries

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
