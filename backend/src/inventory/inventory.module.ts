import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryGateway } from './inventory.gateway';
import { CsvImportService } from '../common/csv-import.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway, CsvImportService],
  exports: [InventoryGateway],
})
export class InventoryModule {}
