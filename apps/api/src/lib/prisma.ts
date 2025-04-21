/**
 * Prisma Client import and re-export for API usage
 * This file imports from the shared database package to ensure schema consistency
 */

// Import PrismaClient and all other exports from the shared database package
import { prisma, PrismaClient } from '@repo/database';

// Re-export Role enum to maintain API compatibility
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

// Export the shared prisma instance as default
export default prisma;

// Re-export necessary types from the database package
export * from '@repo/database';

