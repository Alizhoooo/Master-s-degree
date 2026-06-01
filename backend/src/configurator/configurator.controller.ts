import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfiguratorService } from './configurator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Configurator')
@Controller('configurator')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
@RequirePermissions('configurator.access')
export class ConfiguratorController {
  constructor(private configurator: ConfiguratorService) {}

  @Get('objects')
  @ApiQuery({ name: 'kind', required: false })
  listObjects(@Query('kind') kind?: string) { return this.configurator.listObjects(kind); }

  @Get('objects/:id') getObject(@Param('id') id: string) { return this.configurator.getObject(+id); }
  @Post('objects') createObject(@Body() body: any) { return this.configurator.createObject(body); }
  @Patch('objects/:id') updateObject(@Param('id') id: string, @Body() body: any) { return this.configurator.updateObject(+id, body); }
  @Delete('objects/:id') deleteObject(@Param('id') id: string) { return this.configurator.deleteObject(+id); }
  @Patch('objects/:id/activate') activateObject(@Param('id') id: string) { return this.configurator.activateObject(+id); }

  @Get('print-templates')
  @ApiQuery({ name: 'documentType', required: false })
  listPrintTemplates(@Query('documentType') documentType?: string) { return this.configurator.listPrintTemplates(documentType); }
  @Get('print-templates/:id') getPrintTemplate(@Param('id') id: string) { return this.configurator.getPrintTemplate(+id); }
  @Post('print-templates') createPrintTemplate(@Body() body: any) { return this.configurator.createPrintTemplate(body); }
  @Patch('print-templates/:id') updatePrintTemplate(@Param('id') id: string, @Body() body: any) { return this.configurator.updatePrintTemplate(+id, body); }
  @Delete('print-templates/:id') deletePrintTemplate(@Param('id') id: string) { return this.configurator.deletePrintTemplate(+id); }

  @Post('print-templates/:id/render')
  async renderTemplate(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: Response,
  ) {
    const buffer = await this.configurator.renderPrintTemplate(+id, data || {});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="template-${id}.pdf"`);
    res.send(buffer);
  }

  @Get('export') exportConfig() { return this.configurator.exportConfig(); }
}
