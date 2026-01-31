#!/bin/bash
# Railway startup script - handles migrations and starts server
# This script ensures the server ALWAYS starts regardless of migration status

# DO NOT use set -e - we want to continue even if migrations fail

cd /app/apps/api

echo "=== Railway Startup Script ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"

# Step 1: Try to resolve the failed migration (non-fatal)
echo "Step 1: Resolving failed migration (non-fatal)..."
npx prisma migrate resolve --rolled-back 20260131_add_webhook_secret 2>&1 || echo "Migration resolve skipped"

# Step 2: Run pending migrations (required)
echo "Step 2: Running pending migrations (required)..."
if ! npx prisma migrate deploy 2>&1; then
  echo "Migration deploy failed - exiting to avoid inconsistent schema."
  exit 1
fi

# Step 3: Start the server (this MUST succeed)
echo "Step 3: Starting Node.js server..."
exec node dist/apps/api/src/railway.js
