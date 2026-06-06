import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';
import { CreateAccountDto, UpdateAccountDto } from './dto/chart-of-accounts.dto';
import { CreateEntryDto } from './dto/accounting-entry.dto';

@ApiTags('Accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('accounting.access')
@ApiBearerAuth()
export class AccountingController {
  constructor(private accounting: AccountingService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List chart of accounts' })
  listAccounts() {
    return this.accounting.listAccounts();
  }

  @Get('accounts/:id')
  getAccount(@Param('id') id: string) {
    return this.accounting.getAccount(+id);
  }

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accounting.createAccount(dto);
  }

  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accounting.updateAccount(+id, dto);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string) {
    return this.accounting.deleteAccount(+id);
  }

  @Post('accounts/seed')
  @ApiOperation({ summary: 'Seed standard chart of accounts' })
  seedStandard() {
    return this.accounting.seedStandardPlan();
  }

  @Get('entries')
  @ApiOperation({ summary: 'List accounting entries (проводки)' })
  @ApiQuery({ name: 'period', required: false, example: '2026-05' })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  listEntries(
    @Query('period') period?: string,
    @Query('accountId') accountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.accounting.listEntries({
      period,
      accountId: accountId ? +accountId : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Post('entries')
  @ApiOperation({ summary: 'Create balanced accounting entry (проводка)' })
  createEntry(@Body() dto: CreateEntryDto, @Request() req) {
    return this.accounting.createEntry(dto, req.user.id);
  }

  @Get('turnover')
  @ApiOperation({ summary: 'Account turnover (Оборотно-сальдовая ведомость)' })
  @ApiQuery({ name: 'periodFrom', example: '2026-01' })
  @ApiQuery({ name: 'periodTo', example: '2026-12' })
  getTurnover(@Query('periodFrom') periodFrom: string, @Query('periodTo') periodTo: string) {
    return this.accounting.getAccountTurnover(periodFrom, periodTo);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Trial balance (Оборотно-сальдовый баланс)' })
  @ApiQuery({ name: 'period', example: '2026-05' })
  getTrialBalance(@Query('period') period: string) {
    return this.accounting.getTrialBalance(period);
  }
}
