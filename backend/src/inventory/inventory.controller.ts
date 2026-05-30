import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with available stock' })
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('priority')
  @ApiOperation({ summary: 'Get reservation priority table (α coefficient)' })
  getPriority() {
    return this.inventoryService.getReservationPriority();
  }

  @Post('reserve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute priority-based stock reservation' })
  reserve() {
    return this.inventoryService.reserveByPriority();
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adjust product stock (Admin only)' })
  adjustStock(@Body() body: AdjustStockDto) {
    return this.inventoryService.adjustStock(body.productId, body.userId, body.change, body.reason);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  getAlerts() {
    return this.inventoryService.getStockAlerts();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get inventory change logs' })
  getLogs() {
    return this.inventoryService.getLogs();
  }
}
