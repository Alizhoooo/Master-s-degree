import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
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
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new order' })
  create(@Body() body: CreateOrderDto, @Request() req) {
    return this.orderService.create(body, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: Number })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto, @Request() req) {
    return this.orderService.updateStatus(+id, body.status, req.user.id);
  }

  @Post('bulk-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update order statuses' })
  bulkStatus(@Body() body: { ids: number[]; status: string }, @Request() req) {
    return this.orderService.bulkUpdateStatus(body.ids, body.status, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', type: Number })
  cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(+id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get order status change timeline' })
  @ApiParam({ name: 'id', type: Number })
  getTimeline(@Param('id') id: string) {
    return this.orderService.getTimeline(+id);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Generate PDF invoice for order' })
  @ApiParam({ name: 'id', type: Number })
  async getInvoice(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.orderService.generateInvoice(+id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(buffer);
  }

  @Get(':id/pick-list')
  @ApiOperation({ summary: 'Get pick list for order' })
  @ApiParam({ name: 'id', type: Number })
  getPickList(@Param('id') id: string) {
    return this.orderService.getPickList(+id);
  }
}
