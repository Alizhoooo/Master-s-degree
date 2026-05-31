import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CsvImportService } from '../common/csv-import.service';

@Module({
  controllers: [CrmController],
  providers: [CrmService, CsvImportService],
})
export class CrmModule {}
