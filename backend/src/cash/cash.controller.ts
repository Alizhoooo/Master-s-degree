import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../rbac/rbac.guard';
import { CreateCashRegisterDto, UpdateCashRegisterDto, CreateCashOrderDto } from './dto/cash.dto';

@ApiTags('Cash')
@Controller('cash')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class CashController {
  constructor(private cash: CashService) {}

  @Get('registers')
  @RequirePermissions('cash.access')
  listRegisters() {
    return this.cash.listRegisters();
  }

  @Get('registers/:id')
  @RequirePermissions('cash.access')
  getRegister(@Param('id') id: string) {
    return this.cash.getRegister(+id);
  }

  @Get('registers/:id/balance')
  @RequirePermissions('cash.access')
  getRegisterBalance(@Param('id') id: string) {
    return this.cash.getRegisterBalance(+id);
  }

  @Post('registers')
  @RequirePermissions('cash.register.write')
  createRegister(@Body() dto: CreateCashRegisterDto) {
    return this.cash.createRegister(dto);
  }

  @Patch('registers/:id')
  @RequirePermissions('cash.register.write')
  updateRegister(@Param('id') id: string, @Body() dto: UpdateCashRegisterDto) {
    return this.cash.updateRegister(+id, dto);
  }

  @Delete('registers/:id')
  @RequirePermissions('cash.register.write')
  deleteRegister(@Param('id') id: string) {
    return this.cash.deleteRegister(+id);
  }

  @Get('orders')
  @RequirePermissions('cash.order.read')
  listOrders(@Query() filters: any) {
    return this.cash.listOrders(filters);
  }

  @Post('orders')
  @RequirePermissions('cash.order.write')
  createOrder(@Body() dto: CreateCashOrderDto, @Request() req) {
    return this.cash.createOrder(dto, req.user.id);
  }
}
