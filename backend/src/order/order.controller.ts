import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.orderService.findAll({
      status,
      customerId: customerId ? +customerId : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Post()
  create(
    @Body() body: { customerId: number; items: { productId: number; quantity: number }[]; deliveryAddress: string; deadline: string; notes?: string },
    @Request() req,
  ) {
    return this.orderService.create(body, req.user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Request() req) {
    return this.orderService.updateStatus(+id, body.status, req.user.id);
  }

  @Post(':id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(+id);
  }

  @Get(':id/pick-list')
  getPickList(@Param('id') id: string) {
    return this.orderService.getPickList(+id);
  }
}
