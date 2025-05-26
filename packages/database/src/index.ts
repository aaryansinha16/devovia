/**
 * Production-ready Prisma Client initialization for monorepo setups.
 * This approach follows best practices for Prisma in Turborepo environments.
 */

// Import the PrismaClient directly
import { PrismaClient } from "@prisma/client";

// Re-export all types from Prisma client
export * from "@prisma/client";

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
    return new PrismaClient();
  } else {
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
