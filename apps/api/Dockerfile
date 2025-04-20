FROM node:18-alpine AS builder

# Set up working directory
WORKDIR /app

# First stage: Install dependencies and clone the repo
RUN apk add --no-cache git

# Clone the repository (this way we get the entire monorepo)
RUN git clone https://github.com/aaryansinha16/devovia.git .

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Generate Prisma client in the database package
RUN cd packages/database && pnpm run db:generate && pnpm run build

# Build the API
RUN cd apps/api && pnpm run build

# Second stage: Create a smaller image for running the app
FROM node:18-alpine

WORKDIR /app

# Copy only what we need from the first stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Expose the port the app runs on
EXPOSE 3001

# Set working directory to API
WORKDIR /app/apps/api

# Start the API
CMD ["node", "dist/index.js"]

