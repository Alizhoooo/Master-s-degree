import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Transfers')
@Controller('transfers')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('warehouse.transfer')
@ApiBearerAuth()
export class TransferController {
  constructor(private transfers: TransferService) {}

  @Get()
  @ApiQuery({ name: 'fromWarehouseId', required: false })
  @ApiQuery({ name: 'toWarehouseId', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Query('fromWarehouseId') fromWarehouseId?: string,
    @Query('toWarehouseId') toWarehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.transfers.list({
      fromWarehouseId: fromWarehouseId ? +fromWarehouseId : undefined,
      toWarehouseId: toWarehouseId ? +toWarehouseId : undefined,
      status,
    });
  }

  @Get(':id') get(@Param('id') id: string) { return this.transfers.get(+id); }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.transfers.create({ ...body, userId: req.user.id });
  }
}
