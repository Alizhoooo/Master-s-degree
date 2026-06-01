import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Production')
@Controller('production')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('production.access')
@ApiBearerAuth()
export class ProductionController {
  constructor(private production: ProductionService) {}

  @Get('workshops') listWorkshops() { return this.production.listWorkshops(); }
  @Post('workshops') createWorkshop(@Body() body: { name: string; headId?: number }) { return this.production.createWorkshop(body.name, body.headId); }
  @Patch('workshops/:id') updateWorkshop(@Param('id') id: string, @Body() body: { name?: string; headId?: number }) { return this.production.updateWorkshop(+id, body); }
  @Delete('workshops/:id') deleteWorkshop(@Param('id') id: string) { return this.production.deleteWorkshop(+id); }

  @Get('tech-cards') listTechCards() { return this.production.listTechCards(); }
  @Get('tech-cards/:id') getTechCard(@Param('id') id: string) { return this.production.getTechCard(+id); }
  @Post('tech-cards') createTechCard(@Body() body: { name: string; outputProductId: number; outputQuantity: number; inputs: { productId: number; quantity: number; waste?: number }[] }) {
    return this.production.createTechCard(body);
  }
  @Patch('tech-cards/:id') updateTechCard(@Param('id') id: string, @Body() body: any) { return this.production.updateTechCard(+id, body); }
  @Delete('tech-cards/:id') deleteTechCard(@Param('id') id: string) { return this.production.deleteTechCard(+id); }

  @Get('orders')
  @ApiQuery({ name: 'workshopId', required: false })
  @ApiQuery({ name: 'status', required: false })
  listOrders(@Query('workshopId') workshopId?: string, @Query('status') status?: string) {
    return this.production.listProductionOrders({
      workshopId: workshopId ? +workshopId : undefined,
      status,
    });
  }
  @Post('orders') createOrder(@Body() body: { techCardId: number; workshopId: number; quantity: number; plannedDate: string }) {
    return this.production.createProductionOrder(body);
  }
  @Patch('orders/:id/start') startOrder(@Param('id') id: string) { return this.production.startProduction(+id); }
  @Patch('orders/:id/complete') completeOrder(@Param('id') id: string) { return this.production.completeProduction(+id); }
}
