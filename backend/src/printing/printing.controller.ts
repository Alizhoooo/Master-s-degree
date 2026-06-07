import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { PrintingService } from './printing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  async render(
    @Param('entityType') entityType: string,
    @Param('id') id: string,
    @Param('formCode') formCode: string,
    @Res() res: Response,
  ) {
    const buffer = await this.printingService.renderForm(entityType, +id, formCode);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${formCode}-${id}.pdf"`);
    res.send(buffer);
  }
}
