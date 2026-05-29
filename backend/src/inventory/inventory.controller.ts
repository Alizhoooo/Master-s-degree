import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('priority')
  getPriority() {
    return this.inventoryService.getReservationPriority();
  }

  @Post('reserve')
  reserve() {
    return this.inventoryService.reserveByPriority();
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  adjustStock(@Body() body: { productId: number; userId: number; change: number; reason: string }) {
    return this.inventoryService.adjustStock(body.productId, body.userId, body.change, body.reason);
  }

  @Get('alerts')
  getAlerts() {
    return this.inventoryService.getStockAlerts();
  }

  @Get('logs')
  getLogs() {
    return this.inventoryService.getLogs();
  }
}
