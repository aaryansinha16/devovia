import { PrismaClient, Role } from '@repo/database';

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
