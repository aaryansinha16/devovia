#!/bin/bash

# This script handles building the API for Vercel deployment in a monorepo structure

# Install dependencies at the root level
cd ../../
pnpm install

# Generate Prisma client
cd packages/database
pnpm run db:generate

# Build the database package
pnpm run build

# Return to the API directory and build it
cd ../../apps/api
pnpm run build
