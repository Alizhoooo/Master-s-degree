import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NomenclatureService } from './nomenclature.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Nomenclature')
@Controller('nomenclature')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('warehouse.access')
@ApiBearerAuth()
export class NomenclatureController {
  constructor(private nomenclature: NomenclatureService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'lowStock', required: false })
  list(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.nomenclature.list({
      search,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      lowStock: lowStock === 'true',
    });
  }

  @Get('categories') categories() { return this.nomenclature.categories(); }
  @Get('low-stock') lowStock() { return this.nomenclature.lowStock(); }
  @Get(':id') get(@Param('id') id: string) { return this.nomenclature.get(+id); }
  @Get(':id/price-history') priceHistory(@Param('id') id: string) { return this.nomenclature.priceHistory(+id); }
  @Post() create(@Body() body: any) { return this.nomenclature.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.nomenclature.update(+id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.nomenclature.remove(+id); }
}
