import { PrismaClient, Role as PrismaRole } from '@repo/database';

// Re-export Role enum for use in the API
export const Role = PrismaRole;
// Also export the type for use in type annotations
export type Role = PrismaRole;

// Type guard to check if a value is a valid Role
export function isRole(value: any): value is PrismaRole {
  return Object.values(Role).includes(value as PrismaRole);
}

// Helper function to convert string to Role enum
export function toRole(value: string): PrismaRole {
  if (isRole(value)) {
    return value as PrismaRole;
  }
  throw new Error(`Invalid role: ${value}`);
}

// Role is already exported in the enum declaration above

// Create a singleton Prisma client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Export the Prisma client
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
