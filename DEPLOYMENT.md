# Deployment Guide - Devovia

This document explains the deployment architecture and processes for the Devovia monorepo.

## Architecture Overview

Devovia is a monorepo with the following deployment structure:

- **Frontend (Web App)**: Deployed on **Vercel**
- **Backend (API + WebSocket)**: Deployed on **Railway**
- **Database**: PostgreSQL hosted on **Railway**

---

## Prisma Schema Management

### Single Source of Truth

**Important**: You only need to maintain **ONE** Prisma schema file:

📍 **`packages/database/prisma/schema.prisma`** - This is the single source of truth.

### How It Works

1. **Primary Schema Location**: `packages/database/prisma/schema.prisma`

   - This is where you make all schema changes
   - This is where you create migrations using `prisma migrate dev`

2. **Automatic Synchronization**:

   - A sync script (`scripts/sync-prisma.js`) automatically copies the schema and migrations from `packages/database` to `apps/api`
   - This runs automatically on:
     - Pre-commit hooks
     - Pre-push hooks
     - During builds

3. **Why Two Copies?**
   - `packages/database`: Source of truth, shared across the monorepo
   - `apps/api`: Copy needed for Railway deployment (Railway deploys from `apps/api` and needs the schema there)

### Making Schema Changes

```bash
# 1. Navigate to the database package
cd packages/database

# 2. Edit the schema
# Edit prisma/schema.prisma

# 3. Create a migration
pnpm exec prisma migrate dev --name your_migration_name

# 4. The sync script will automatically copy to apps/api during commit/push
git add .
git commit -m "feat: add new schema changes"
git push
```

**Never manually edit `apps/api/prisma/schema.prisma`** - it will be overwritten by the sync script.

---

## Railway Deployment (Backend API + WebSocket)

### Configuration Files

1. **`nixpacks.toml`** (Root level)

   - Configures the Nixpacks build process
   - Defines setup, install, build, and start phases
   - Key configurations:

     ```toml
     [phases.setup]
     nixPkgs = ["nodejs_22", "pnpm"]

     [phases.install]
     cmds = ["pnpm install --frozen-lockfile"]

     [phases.build]
     cmds = [
       "cd packages/database && pnpm exec prisma generate",
       "cd packages/database && pnpm exec tsc",
       "cp -r packages/database/dist node_modules/.pnpm/.../",
       "cd apps/api && pnpm exec prisma generate",
       "cd apps/api && pnpm exec tsc"
     ]

     [start]
     cmd = "cd apps/api && pnpm exec prisma migrate deploy && node dist/apps/api/src/index.js"
     ```

2. **`railway.json`** (Root level)
   - Defines Railway service configuration
   - Specifies watch patterns for auto-deployment
   - Key settings:
     ```json
     {
       "build": {
         "builder": "NIXPACKS",
         "watchPatterns": [
           "apps/api/**",
           "packages/database/**",
           "nixpacks.toml",
           "pnpm-lock.yaml"
         ]
       },
       "deploy": {
         "startCommand": "cd apps/api && pnpm exec prisma migrate deploy && node dist/apps/api/src/index.js",
         "healthcheckPath": "/api/hc"
       }
     }
     ```

### Build Process

Railway builds from the **monorepo root** with the following steps:

1. **Setup Phase**: Install Node.js 22 and pnpm
2. **Install Phase**: Run `pnpm install --frozen-lockfile` from root
3. **Build Phase**:
   - Generate Prisma client in `packages/database`
   - Build `packages/database` TypeScript code
   - Copy built database package to pnpm symlink location (fixes workspace resolution)
   - Generate Prisma client in `apps/api`
   - Build `apps/api` TypeScript code
4. **Start Phase**:
   - Run database migrations (`prisma migrate deploy`)
   - Start the server (`node dist/apps/api/src/index.js`)

### WebSocket Server

The API server (`apps/api/src/index.ts`) runs **both** HTTP and WebSocket on the same port:

- **HTTP API**: Express server on port defined by `PORT` env variable
- **WebSocket**: Yjs collaboration server attached to the same HTTP server
- Railway exposes this single port publicly

### Environment Variables (Railway)

Required environment variables in Railway:

```env
DATABASE_URL=postgresql://...          # PostgreSQL connection string
JWT_SECRET=your_secret_key             # JWT signing secret
PORT=4000                              # Server port (Railway sets this)
NODE_ENV=production                    # Environment
FRONTEND_URL=https://devovia.com       # Frontend URL for CORS
API_URL=https://devovia-api.up.railway.app/api  # API base URL
```

### Deployment Triggers

Railway automatically deploys when changes are pushed to `main` branch that affect:

- `apps/api/**`
- `packages/database/**`
- `nixpacks.toml`
- `pnpm-lock.yaml`

---

## Vercel Deployment (Frontend)

### Configuration

The web app (`apps/web`) is deployed on Vercel with standard Next.js configuration.

### Environment Variables (Vercel)

Required environment variables in Vercel:

```env
NEXT_PUBLIC_API_URL=https://devovia-api.up.railway.app/api
NEXT_PUBLIC_WS_URL=wss://devovia-api.up.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://devovia.com
```

**Important**:

- `NEXT_PUBLIC_WS_URL` must use `wss://` (secure WebSocket)
- It points to the same Railway domain as the API (WebSocket runs on same port)

### Deployment Triggers

Vercel automatically deploys when changes are pushed to `main` branch.

---

## Common Deployment Issues & Solutions

### 1. Module Resolution Errors

**Issue**: `Cannot find module '@repo/database'`

**Solution**: The build process copies the built database package to the pnpm symlink location:

```bash
cp -r packages/database/dist node_modules/.pnpm/file+packages+database_prisma@5.11.0/node_modules/@repo/database/
```

If the pnpm hash changes, update this path in `nixpacks.toml`.

### 2. WebSocket Connection Failures

**Issue**: WebSocket connections fail or connect to localhost

**Solution**:

- Ensure `NEXT_PUBLIC_WS_URL` is set in Vercel to `wss://devovia-api.up.railway.app`
- Verify the WebSocket server is running (check Railway logs for "WebSocket server attached to HTTP server")

### 3. Database Migration Issues

**Issue**: Migrations don't run or schema is out of sync

**Solution**:

- Ensure migrations are created in `packages/database/prisma/migrations`
- The sync script will copy them to `apps/api/prisma/migrations`
- Railway runs `prisma migrate deploy` on startup

### 4. ESM/CommonJS Compatibility

**Issue**: `ERR_REQUIRE_ESM` errors

**Solution**:

- Downgrade problematic packages to CommonJS-compatible versions
- Example: `@octokit/rest` was downgraded from v22 to v20

---

## Deployment Checklist

### Before Deploying Schema Changes

- [ ] Edit `packages/database/prisma/schema.prisma`
- [ ] Run `pnpm exec prisma migrate dev --name migration_name` in `packages/database`
- [ ] Test locally
- [ ] Commit and push (sync script runs automatically)
- [ ] Verify Railway deployment logs show migration success

### Before Deploying API Changes

- [ ] Test locally with `pnpm dev` from root
- [ ] Ensure TypeScript compiles without errors
- [ ] Update environment variables if needed
- [ ] Push to `main` branch
- [ ] Monitor Railway deployment logs
- [ ] Test healthcheck endpoint: `https://devovia-api.up.railway.app/api/hc`

### Before Deploying Frontend Changes

- [ ] Test locally with `pnpm dev` from `apps/web`
- [ ] Ensure build succeeds: `pnpm build` from `apps/web`
- [ ] Update environment variables in Vercel if needed
- [ ] Push to `main` branch
- [ ] Monitor Vercel deployment logs

---

## Monitoring & Debugging

### Railway Logs

Access logs via Railway dashboard or CLI:

```bash
railway logs
```

Look for:

- ✅ Database connected successfully
- ✅ WebSocket server attached to HTTP server
- ✅ Express server running on http://localhost:PORT

### Vercel Logs

Access via Vercel dashboard under Deployments → [Your Deployment] → Logs

### Health Checks

- **API Health**: `https://devovia-api.up.railway.app/api/hc`
- **WebSocket**: Check browser console for connection logs

---

## Rollback Procedures

### Railway Rollback

1. Go to Railway dashboard → Deployments
2. Find the last working deployment
3. Click "Redeploy"

### Vercel Rollback

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "Promote to Production"

### Database Rollback

⚠️ **Caution**: Database rollbacks are destructive

```bash
# In packages/database
pnpm exec prisma migrate resolve --rolled-back migration_name
```

---

## Development vs Production

### Development (Local)

- API runs on `http://localhost:4000`
- WebSocket runs on `ws://localhost:4001` (separate port)
- Uses `standalone.ts` which starts both servers separately

### Production (Railway)

- API and WebSocket run on same port (Railway's `PORT` env variable)
- Uses `index.ts` which attaches WebSocket to HTTP server
- Single public endpoint: `https://devovia-api.up.railway.app`

---

## Key Files Reference

```
devovia/
├── nixpacks.toml                    # Railway build configuration
├── railway.json                     # Railway deployment config
├── scripts/
│   └── sync-prisma.js              # Prisma sync script
├── packages/
│   └── database/
│       └── prisma/
│           ├── schema.prisma       # ⭐ Single source of truth
│           └── migrations/         # ⭐ Create migrations here
└── apps/
    ├── api/
    │   ├── src/
    │   │   ├── index.ts           # Production entry point (Railway)
    │   │   ├── standalone.ts      # Development entry point
    │   │   └── websocket/
    │   │       └── simple-yjs-server.ts  # WebSocket server
    │   └── prisma/
    │       ├── schema.prisma      # Auto-synced copy (don't edit)
    │       └── migrations/        # Auto-synced copy (don't edit)
    └── web/
        └── lib/
            └── api-config.ts      # API and WebSocket URL config
```

---

## Support & Troubleshooting

For deployment issues:

1. Check Railway/Vercel deployment logs
2. Verify environment variables are set correctly
3. Test healthcheck endpoints
4. Check browser console for WebSocket connection errors
5. Review this documentation for common issues

---

**Last Updated**: January 2026
