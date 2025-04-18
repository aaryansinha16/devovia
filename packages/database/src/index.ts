import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use type assertion to fix TypeScript error
export const prisma = (global as any).prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export * from '@prisma/client';
