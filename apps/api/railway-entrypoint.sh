#!/bin/bash
# Railway deployment entrypoint script

echo "Setting up deployment environment..."

# Install global dependencies
npm install -g pnpm

# Install project dependencies
pnpm install

# Build database package first
cd ../packages/database
pnpm run db:generate
pnpm run build

# Return to API directory and build
cd ../../apps/api
pnpm run build

# Start the API
node dist/index.js
