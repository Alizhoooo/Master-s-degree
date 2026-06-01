import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Warehouse')
@Controller('warehouse')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class WarehouseController {
  constructor(private warehouse: WarehouseService) {}

  @Get()
  @RequirePermissions('warehouse.access')
  listWarehouses() { return this.warehouse.listWarehouses(); }

  @Get(':id')
  @RequirePermissions('warehouse.access')
  getWarehouse(@Param('id') id: string) { return this.warehouse.getWarehouse(+id); }

  @Post()
  @RequirePermissions('warehouse.write')
  createWarehouse(@Body() body: { name: string; address?: string; isMain?: boolean }) {
    return this.warehouse.createWarehouse(body.name, body.address, body.isMain);
  }

  @Patch(':id')
  @RequirePermissions('warehouse.write')
  updateWarehouse(@Param('id') id: string, @Body() body: { name?: string; address?: string; isMain?: boolean }) {
    return this.warehouse.updateWarehouse(+id, body);
  }

  @Delete(':id')
  @RequirePermissions('warehouse.write')
  deleteWarehouse(@Param('id') id: string) { return this.warehouse.deleteWarehouse(+id); }

  @Get(':id/stock')
  @RequirePermissions('warehouse.access')
  getStockBalance(@Param('id') id: string) { return this.warehouse.getStockBalance(+id); }

  @Post('transfer')
  @RequirePermissions('warehouse.transfer')
  transferStock(
    @Body() body: { fromWarehouseId: number; toWarehouseId: number; productId: number; quantity: number },
    @Request() req,
  ) {
    return this.warehouse.transferStock(body.fromWarehouseId, body.toWarehouseId, body.productId, body.quantity, req.user.id);
  }

  @Get('batches/list')
  @RequirePermissions('warehouse.access')
  listBatches(@Query('productId') productId?: string) {
    return this.warehouse.listBatches(productId ? +productId : undefined);
  }

  @Post('batches')
  @RequirePermissions('warehouse.write')
  createBatch(
    @Body() body: { productId: number; batchNo: string; quantity: number; costPrice: number; expiryDate?: string },
    @Request() req,
  ) {
    return this.warehouse.createBatch(body.productId, body.batchNo, body.quantity, body.costPrice, body.expiryDate, req.user.id);
  }

  @Get('movements/list')
  @RequirePermissions('warehouse.access')
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  listMovements(
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.warehouse.listMovements({
      warehouseId: warehouseId ? +warehouseId : undefined,
      productId: productId ? +productId : undefined,
      dateFrom,
      dateTo,
    });
  }
}
