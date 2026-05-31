import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
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

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import products from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.inventoryService.importProducts(file);
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
