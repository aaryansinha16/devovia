#!/bin/bash

# This script sets up Prisma for the API deployment
# It copies the schema from the database package if available,
# otherwise it uses a local copy

echo "Setting up Prisma for API deployment..."

# Create prisma directory if it doesn't exist
mkdir -p prisma

# Try to copy from the monorepo structure first
if [ -f "../../packages/database/prisma/schema.prisma" ]; then
  echo "Using schema from monorepo structure..."
  cp ../../packages/database/prisma/schema.prisma prisma/
else
  echo "Using local schema..."
  # If we're in a standalone deployment, the schema should already be in place
  # This is just a fallback
fi

# Generate the Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Prisma setup complete!"
