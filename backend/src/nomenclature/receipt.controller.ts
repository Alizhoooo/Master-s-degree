import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReceiptService } from './receipt.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Receipts')
@Controller('receipts')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('warehouse.write')
@ApiBearerAuth()
export class ReceiptController {
  constructor(private receipts: ReceiptService) {}

  @Get()
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  list(
    @Query('supplierId') supplierId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.receipts.list({
      supplierId: supplierId ? +supplierId : undefined,
      warehouseId: warehouseId ? +warehouseId : undefined,
      status,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id') get(@Param('id') id: string) { return this.receipts.get(+id); }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.receipts.create({ ...body, userId: req.user.id });
  }
}
