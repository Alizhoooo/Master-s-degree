import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryGateway } from './inventory.gateway';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway],
  exports: [InventoryGateway],
})
export class InventoryModule {}
