import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('warehouse.access')
@ApiBearerAuth()
export class SupplierController {
  constructor(private suppliers: SupplierService) {}

  @Get() list() { return this.suppliers.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.suppliers.get(+id); }
  @Get(':id/receipts') receipts(@Param('id') id: string) { return this.suppliers.receipts(+id); }
  @Post() create(@Body() body: any) { return this.suppliers.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.suppliers.update(+id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.suppliers.remove(+id); }
}
