# Webhook Security Implementation Guide

## Overview
This document outlines the implementation plan for webhook signature verification to secure webhook endpoints from unauthorized requests.

## Current Status
⚠️ **CRITICAL**: Webhook signature verification is currently disabled in `webhook.controller.ts`. This creates a security vulnerability where anyone can send fake webhook requests.

## Implementation Plan

### 1. Database Schema Updates
Add `webhookSecret` field to `PlatformConnection` model:

```prisma
model PlatformConnection {
  // ... existing fields
  webhookSecret    String?  // Secret for verifying webhook signatures
}
```

### 2. Webhook Secret Management

#### For GitHub Webhooks:
1. When creating a webhook in GitHub, GitHub generates a secret
2. Store this secret in the `PlatformConnection.webhookSecret` field (encrypted)
3. Use this secret to verify the `X-Hub-Signature-256` header

#### For Vercel Webhooks:
1. Vercel provides a signing secret when creating webhooks
2. Store in `PlatformConnection.webhookSecret` (encrypted)
3. Verify using the `x-vercel-signature` header

#### For Netlify Webhooks:
1. Netlify uses JWS (JSON Web Signature) for webhook verification
2. Store the webhook secret in `PlatformConnection.webhookSecret`
3. Verify using the `X-Webhook-Signature` header

### 3. Implementation Steps

#### Step 1: Update Platform Connection Creation
```typescript
// In deployment.controller.ts createConnection function
const connection = await db.platformConnection.create({
  data: {
    userId,
    platform: data.platform,
    platformName: data.platformName,
    accessToken: encrypt(data.accessToken),
    refreshToken: data.refreshToken ? encrypt(data.refreshToken) : undefined,
    webhookSecret: data.webhookSecret ? encrypt(data.webhookSecret) : undefined, // Add this
    // ... other fields
  },
});
```

#### Step 2: Update Webhook Controller
```typescript
// In webhook.controller.ts

import { decrypt } from '../utils/encryption.util';

export async function handleGitHubWebhook(req: Request, res: Response) {
  try {
    const event = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const payload = req.body;

    // Find the connection based on repository information
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      return res.status(400).json(errorResponse({ 
        code: 'INVALID_PAYLOAD', 
        message: 'Repository information missing' 
      }));
    }

    // Find matching connection with webhook secret
    const connection = await db.platformConnection.findFirst({
      where: {
        platform: 'GITHUB',
        // You may need to add a field to track which repos this connection manages
      },
    });

    if (!connection?.webhookSecret) {
      return res.status(400).json(errorResponse({ 
        code: 'NO_WEBHOOK_SECRET', 
        message: 'Webhook secret not configured' 
      }));
    }

    // Decrypt and verify signature
    const webhookSecret = decrypt(connection.webhookSecret);
    if (!signature) {
      return res.status(401).json(errorResponse({ 
        code: 'MISSING_SIGNATURE', 
        message: 'Webhook signature required' 
      }));
    }

    if (!verifyGitHubSignature(rawBody, signature, webhookSecret)) {
      return res.status(401).json(errorResponse({ 
        code: 'INVALID_SIGNATURE', 
        message: 'Invalid webhook signature' 
      }));
    }

    // Process webhook...
    switch (event) {
      case 'push':
        await handleGitHubPush(payload);
        break;
      // ... other cases
    }

    res.json(successResponse({ received: true, event }, 'Webhook processed'));
  } catch (error: any) {
    res.status(500).json(internalServerError(error));
  }
}
```

#### Step 3: Signature Verification Functions

The `verifyGitHubSignature` function already exists in webhook.controller.ts:

```typescript
function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

Add similar functions for other platforms:

```typescript
function verifyVercelSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha1', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function verifyNetlifySignature(payload: string, signature: string, secret: string): boolean {
  // Netlify uses JWS - implementation depends on their specific format
  // See: https://docs.netlify.com/site-deploys/notifications/#payload-signature
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### 4. Connection Identification Strategy

Since webhooks don't include connection IDs, we need a strategy to identify which connection to use:

#### Option A: Repository-based matching
Add a `repositories` field to `PlatformConnection` to track which repos it manages:
```prisma
model PlatformConnection {
  // ... existing fields
  repositories     String[]  // Array of repo full names (e.g., ["owner/repo1", "owner/repo2"])
}
```

#### Option B: Webhook URL with connection ID
Include the connection ID in the webhook URL:
```
https://api.devovia.com/api/webhooks/github/{connectionId}
```

Update routes:
```typescript
router.post('/github/:connectionId?', webhookRateLimiter, handleGitHubWebhook);
```

**Recommendation**: Use Option B as it's more explicit and easier to manage.

### 5. Migration Steps

1. Run Prisma migration to add `webhookSecret` field:
```bash
pnpm --filter @repo/database prisma migrate dev --name add_webhook_secret
```

2. Update API to accept webhook secrets when creating connections

3. Update frontend to collect webhook secrets during platform connection setup

4. Provide UI to regenerate/update webhook secrets

5. Add documentation for users on how to configure webhooks in each platform

### 6. Testing

Create test cases for:
- Valid signature verification
- Invalid signature rejection
- Missing signature rejection
- Missing webhook secret handling
- Expired/rotated secrets

### 7. Security Considerations

✅ **Implemented**:
- Webhook secrets stored encrypted in database
- Secrets decrypted only when needed for verification
- Rate limiting on webhook endpoints (100 requests per 15 minutes)

⚠️ **TODO**:
- Implement webhook secret rotation mechanism
- Add webhook delivery logs for debugging
- Implement replay attack prevention (check delivery ID uniqueness)
- Add monitoring/alerting for failed webhook verifications

### 8. Documentation for Users

Provide clear instructions for each platform:

#### GitHub:
1. Go to repository Settings → Webhooks → Add webhook
2. Set Payload URL: `https://api.devovia.com/api/webhooks/github/{connectionId}`
3. Set Content type: `application/json`
4. Generate a secret and copy it
5. Select events: Push, Deployment, Deployment status
6. Save webhook
7. Paste the secret into Devovia connection settings

#### Vercel:
1. Go to Project Settings → Git → Deploy Hooks
2. Create a deploy hook
3. Copy the webhook URL and secret
4. Add to Devovia connection settings

#### Netlify:
1. Go to Site Settings → Build & deploy → Deploy notifications
2. Add notification → Outgoing webhook
3. Set URL: `https://api.devovia.com/api/webhooks/netlify/{connectionId}`
4. Copy the signing secret
5. Add to Devovia connection settings

## Next Steps

1. ✅ Encrypt access tokens (COMPLETED)
2. ✅ Decrypt tokens before API calls (COMPLETED)
3. ⏳ Add `webhookSecret` field to Prisma schema
4. ⏳ Update connection creation to accept webhook secrets
5. ⏳ Implement signature verification in webhook handlers
6. ⏳ Update frontend to collect webhook secrets
7. ⏳ Add user documentation
8. ⏳ Test webhook verification with all platforms

## References

- [GitHub Webhook Security](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- [Vercel Webhook Security](https://vercel.com/docs/observability/webhooks-overview/webhooks-api#securing-webhooks)
- [Netlify Webhook Security](https://docs.netlify.com/site-deploys/notifications/#payload-signature)
