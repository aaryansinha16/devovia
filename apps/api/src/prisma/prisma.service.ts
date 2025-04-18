import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Import directly from the database package's source
import { prisma } from '@repo/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect to the database when the module initializes
    await prisma.$connect();
  }

  async onModuleDestroy() {
    // Disconnect from the database when the module is destroyed
    await prisma.$disconnect();
  }

  // Expose the Prisma client through this service
  get client() {
    return prisma;
  }
}
