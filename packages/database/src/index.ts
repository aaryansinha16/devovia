import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 */

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use type assertion for global object
// eslint-disable-next-line no-unused-vars
const globalWithPrisma = global as unknown as { prisma?: PrismaClient };

// Prevent multiple instances of Prisma Client in development
let prismaInstance: PrismaClient | undefined;

function getPrismaInstance(): PrismaClient {
  if (!prismaInstance) {
    // Create a new PrismaClient instance
    prismaInstance = globalWithPrisma.prisma || new PrismaClient();

    // In development, save to global to prevent multiple instances
    if (process.env.NODE_ENV !== "production") {
      globalWithPrisma.prisma = prismaInstance;
    }
  }

  return prismaInstance;
}

// Export the Prisma client instance
export const prisma = getPrismaInstance();

// Export types from Prisma client
export * from "@prisma/client";
