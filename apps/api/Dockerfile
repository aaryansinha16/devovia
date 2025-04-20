FROM node:18-alpine

# Set up working directory
WORKDIR /app

# Create necessary directory structure
RUN mkdir -p packages/database/prisma packages/database/src apps/api/src

# Install dependencies
RUN npm install -g prisma

# Copy the shared database package first
COPY packages/database/package.json packages/database/
COPY packages/database/prisma/schema.prisma packages/database/prisma/
COPY packages/database/src/ packages/database/src/

# Copy API package files
COPY apps/api/package.json apps/api/
COPY apps/api/src/ apps/api/src/
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Generate Prisma client in the database package
RUN cd packages/database && pnpm run db:generate && pnpm run build

# Build the API
RUN cd apps/api && pnpm run build

# Expose the port the app runs on
EXPOSE 3001

# Set working directory to API
WORKDIR /app/apps/api

# Start the API
CMD ["node", "dist/index.js"]

