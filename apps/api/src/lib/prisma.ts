/**
 * Prisma Client import and re-export for API usage
 * This file supports both monorepo development and standalone deployment
 */

// Import PrismaClient - try from shared package first, fall back to local if needed
let prismaInstance;
let prismaPkg;

// Define Role enum to maintain API compatibility regardless of import source
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// Type guard to check if a value is a valid Role
export function isRole(value: any): value is Role {
  return Object.values(Role).includes(value as Role);
}

// Helper function to convert string to Role enum
export function toRole(value: string): Role {
  if (isRole(value)) {
    return value as Role;
  }
  throw new Error(`Invalid role: ${value}`);
}

// Initialize Prisma client with fall-back mechanism
try {
  // Try to import from shared database package (development environment)
  prismaPkg = require('@repo/database');
  console.log('Using shared Prisma client from @repo/database');
  prismaInstance = prismaPkg.prisma;
  
  // Re-export types from database package
  module.exports = {
    ...prismaPkg,
    default: prismaInstance,
    Role,
    isRole,
    toRole
  };
} catch (error) {
  // Fall back to local Prisma client (Railway deployment)
  console.log('Falling back to local Prisma client');
  const { PrismaClient } = require('@prisma/client');
  
  // Create local client
  const createPrismaClient = () => {
    if (process.env.NODE_ENV === "production") {
      return new PrismaClient();
    } else {
      // Add prisma to global scope for development to prevent multiple instances
      const globalForPrisma = global as unknown as { prisma?: typeof PrismaClient };
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient({
          log: ['query', 'error', 'warn'],
        });
      }
      return globalForPrisma.prisma;
    }
  };
  
  prismaInstance = createPrismaClient();
  
  // Export local types
  module.exports = {
    ...require('@prisma/client'),
    default: prismaInstance,
    Role,
    isRole,
    toRole
  };
}

// Export Prisma client as default
export default prismaInstance;

