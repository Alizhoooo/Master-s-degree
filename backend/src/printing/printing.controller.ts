import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { PrintingService } from './printing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfLocale } from './renderers/pdf-translations';

@ApiTags('Printing')
@Controller('printing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrintingController {
  constructor(private printingService: PrintingService) {}

  @Get('forms')
  @ApiOperation({ summary: 'List all available print forms in the registry' })
  async listAllForms() {
    return this.printingService.listForms();
  }

  @Get('forms/:entityType')
  @ApiOperation({ summary: 'List print forms applicable to a given entity type' })
  @ApiParam({ name: 'entityType', example: 'Order' })
  async listFormsForEntity(@Param('entityType') entityType: string) {
    return this.printingService.listFormsForEntity(entityType);
  }

  @Get('render/:entityType/:id/:formCode')
  @ApiOperation({ summary: 'Render a printable form as PDF' })
  @ApiParam({ name: 'entityType', example: 'Order' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'formCode', example: 'torg-12' })
  @ApiQuery({ name: 'locale', enum: ['kk', 'ru', 'en'], required: false })
  async render(
    @Res() res: Response,
    @Param('entityType') entityType: string,
    @Param('id') id: string,
    @Param('formCode') formCode: string,
    @Query('locale') locale?: string,
  ) {
    const lc = (locale || 'ru').toLowerCase() as PdfLocale;
    const validLocale: PdfLocale = ['kk', 'ru', 'en'].includes(lc) ? lc : 'ru';
    const buffer = await this.printingService.renderForm(entityType, +id, formCode, validLocale);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${formCode}-${id}.pdf"`);
    res.send(buffer);
  }
}
