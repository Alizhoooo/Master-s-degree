import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { CrmModule } from './crm/crm.module';
import { OrderModule } from './order/order.module';
import { ReportModule } from './report/report.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    InventoryModule,
    CrmModule,
    OrderModule,
    ReportModule,
    AiModule,
    AdminModule,
  ],
})
export class AppModule {}
