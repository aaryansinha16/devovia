/**
 * Direct Prisma Client Implementation
 *
 * This file provides a direct implementation of the Prisma client for the API
 * to avoid initialization issues in the monorepo structure.
 */

import { PrismaClient } from '@prisma/client';

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use type assertion for global object
// eslint-disable-next-line no-unused-vars
const globalWithPrisma = global as unknown as { prisma?: PrismaClient };

// Create Prisma Client singleton
export const prisma = globalWithPrisma.prisma || new PrismaClient();

// Save to global in development
if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma;
}
