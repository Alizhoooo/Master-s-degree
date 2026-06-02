import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import helmet from 'helmet';
import { CacheModule } from './common/cache.module';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { CrmModule } from './crm/crm.module';
import { OrderModule } from './order/order.module';
import { ReportModule } from './report/report.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { AccountingModule } from './accounting/accounting.module';
import { CashModule } from './cash/cash.module';
import { BankModule } from './bank/bank.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { ProductionModule } from './production/production.module';
import { HrModule } from './hr/hr.module';
import { DocumentModule } from './document/document.module';
import { RbacModule } from './rbac/rbac.module';
import { TaskModule } from './task/task.module';
import { NotificationModule } from './notification/notification.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { SearchModule } from './search/search.module';
import { NomenclatureModule } from './nomenclature/nomenclature.module';
import { I18nModule } from './i18n/i18n.module';
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
    CacheModule,
    PrismaModule,
    AuthModule,
    InventoryModule,
    CrmModule,
    OrderModule,
    ReportModule,
    AiModule,
    AdminModule,
    HealthModule,
    AccountingModule,
    CashModule,
    BankModule,
    WarehouseModule,
    ProductionModule,
    HrModule,
    DocumentModule,
    RbacModule,
    TaskModule,
    NotificationModule,
    SchedulerModule,
    ConfiguratorModule,
    SearchModule,
    NomenclatureModule,
    I18nModule,
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
