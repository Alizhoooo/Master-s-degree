import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import helmet from 'helmet';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { CrmModule } from './crm/crm.module';
import { OrderModule } from './order/order.module';
import { ReportModule } from './report/report.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import appConfig from './common/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { ttl: 60000, limit: config.get<number>('app.rateLimit', 100) },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    InventoryModule,
    CrmModule,
    OrderModule,
    ReportModule,
    AiModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(helmet()).forRoutes('*');
  }
}
