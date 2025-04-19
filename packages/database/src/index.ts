import { PrismaClient } from "@prisma/client";

/**
 * Production-ready Prisma Client initialization for monorepo setups.
 * This approach follows best practices for Prisma in Turborepo environments.
 */

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prismaGlobal = global as unknown as { prisma?: PrismaClient };

// Function to get or create the Prisma instance
function createPrismaClient() {
  // In development, use a global variable to avoid exhausting your
  // database connection limit due to hot reloading.
  if (process.env.NODE_ENV === "production") {
    // For production, create a new client
    return new PrismaClient();
  } else {
    // For development, use a global singleton
    if (!prismaGlobal.prisma) {
      prismaGlobal.prisma = new PrismaClient({
        log: ["query", "error", "warn"],
      });
    }
    return prismaGlobal.prisma;
  }
}

// Export the Prisma client instance
export const prisma = createPrismaClient();

// Export types from Prisma client
export * from "@prisma/client";
