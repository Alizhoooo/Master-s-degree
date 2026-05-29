import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportService.getDashboard();
  }

  @Get()
  getReports(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportService.getReports({
      status,
      customerId: customerId ? +customerId : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Get('export')
  async exportCsv(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const csv = await this.reportService.exportCsv({
      status,
      customerId: customerId ? +customerId : undefined,
      dateFrom,
      dateTo,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send(csv);
  }
}
