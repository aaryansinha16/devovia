FROM node:18-alpine

WORKDIR /app

# Copy root package.json and workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for database package and API
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client and build database package
RUN cd packages/database && pnpm run db:generate && pnpm run build

# Build the API
RUN cd apps/api && pnpm run build

# Expose the port the app runs on
EXPOSE 3001

# Set working directory to API
WORKDIR /app/apps/api

# Start the API
CMD ["node", "dist/index.js"]

