#!/bin/bash

# This script is used by Vercel to build only the web app and skip the API
echo "Building only the web app for Vercel deployment..."

# Install dependencies with --no-frozen-lockfile
pnpm install --no-frozen-lockfile

# Build only the web app
pnpm run build --filter=web

echo "Web app build completed successfully!"
