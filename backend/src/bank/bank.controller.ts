import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BankService } from './bank.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../rbac/rbac.guard';
import { CreateBankAccountDto, UpdateBankAccountDto, CreateBankOrderDto } from './dto/bank.dto';

@ApiTags('Bank')
@Controller('bank')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class BankController {
  constructor(private bank: BankService) {}

  @Get('accounts')
  @RequirePermissions('bank.access')
  listAccounts() { return this.bank.listAccounts(); }

  @Get('accounts/:id')
  @RequirePermissions('bank.access')
  getAccount(@Param('id') id: string) { return this.bank.getAccount(+id); }

  @Post('accounts')
  @RequirePermissions('bank.account.write')
  createAccount(@Body() dto: CreateBankAccountDto) { return this.bank.createAccount(dto); }

  @Patch('accounts/:id')
  @RequirePermissions('bank.account.write')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) { return this.bank.updateAccount(+id, dto); }

  @Delete('accounts/:id')
  @RequirePermissions('bank.account.write')
  deleteAccount(@Param('id') id: string) { return this.bank.deleteAccount(+id); }

  @Get('orders')
  @RequirePermissions('bank.order.read')
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  listOrders(
    @Query('accountId') accountId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.bank.listOrders({ accountId: accountId ? +accountId : undefined, type, status });
  }

  @Post('orders')
  @RequirePermissions('bank.order.write')
  createOrder(@Body() dto: CreateBankOrderDto, @Request() req) { return this.bank.createOrder(dto, req.user.id); }

  @Patch('orders/:id/confirm')
  @RequirePermissions('bank.order.write')
  confirmOrder(@Param('id') id: string, @Request() req) { return this.bank.confirmOrder(+id, req.user.id); }
}
