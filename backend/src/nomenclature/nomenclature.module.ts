import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard } from '../rbac/rbac.guard';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { NomenclatureController } from './nomenclature.controller';
import { NomenclatureService } from './nomenclature.service';
import { ReceiptController } from './receipt.controller';
import { ReceiptService } from './receipt.service';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { ExpiryController } from './expiry.controller';
import { ExpiryService } from './expiry.service';

@Global()
@Module({
  controllers: [
    SupplierController,
    NomenclatureController,
    ReceiptController,
    IssueController,
    TransferController,
    ExpiryController,
  ],
  providers: [
    SupplierService,
    NomenclatureService,
    ReceiptService,
    IssueService,
    TransferService,
    ExpiryService,
  ],
  exports: [
    SupplierService,
    NomenclatureService,
    ReceiptService,
    IssueService,
    TransferService,
    ExpiryService,
  ],
})
export class NomenclatureModule {}
