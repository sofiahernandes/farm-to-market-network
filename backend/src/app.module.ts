import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartOrdersModule } from './modules/cart-orders/cart-orders.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ProducerModule } from './modules/producer/producer.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    CartOrdersModule,
    SubscriptionsModule,
    ProducerModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
