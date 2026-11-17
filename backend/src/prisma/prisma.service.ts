import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../../prisma/seed';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    if (process.env.AUTO_SEED_ON_BOOT === 'false') return;
    try {
      const count = await this.product.count();
      if (count === 0) {
        await seedDatabase(this);
      }
    } catch {
      // Schema not pushed yet or concurrent seed in progress
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
