/**
 * Prisma Client for API with direct import for Railway deployment
 */

import { PrismaClient } from '@prisma/client';

// Define Role enum to maintain API compatibility
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
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

// Create Prisma client (singleton to prevent multiple instances)
let prisma: PrismaClient;

// Configuration for Prisma client with required fields for Prisma 5.x
const prismaOptions: { log: Array<'query' | 'error' | 'warn' | 'info'> } = {
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
};

// For Prisma 5.x, we need to handle the client creation differently
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  // In development, use global object to prevent multiple instances
  const globalForPrisma = global as unknown as { prisma?: PrismaClient };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient(prismaOptions);
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;

// Re-export all types from Prisma client
export * from '@prisma/client';
