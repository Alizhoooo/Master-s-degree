import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('HR')
@Controller('hr')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('hr.access')
@ApiBearerAuth()
export class HrController {
  constructor(private hr: HrService) {}

  @Get('employees')
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  listEmployees(@Query('department') department?: string, @Query('isActive') isActive?: string) {
    return this.hr.listEmployees({
      department,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }
  @Get('employees/:id') getEmployee(@Param('id') id: string) { return this.hr.getEmployee(+id); }
  @Post('employees') createEmployee(@Body() body: any) { return this.hr.createEmployee(body); }
  @Patch('employees/:id') updateEmployee(@Param('id') id: string, @Body() body: any) { return this.hr.updateEmployee(+id, body); }
  @Patch('employees/:id/fire') fireEmployee(@Param('id') id: string, @Body() body: { fireDate: string }) { return this.hr.fireEmployee(+id, body.fireDate); }

  @Get('timesheets')
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  listTimesheets(
    @Query('employeeId') employeeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.hr.listTimesheets({
      employeeId: employeeId ? +employeeId : undefined,
      dateFrom,
      dateTo,
    });
  }
  @Post('timesheets') upsertTimesheet(
    @Body() body: { employeeId: number; date: string; hours: number; overtime: number; type: string },
  ) {
    return this.hr.upsertTimesheet(body.employeeId, body.date, body.hours, body.overtime, body.type);
  }

  @Get('payroll')
  @ApiQuery({ name: 'period', required: false })
  listPayroll(@Query('period') period?: string) { return this.hr.listPayroll(period); }
  @Post('payroll/calculate')
  calculatePayroll(@Body() body: { period: string }, @Request() req) { return this.hr.calculatePayroll(body.period, req.user.id); }
  @Patch('payroll/:id/pay') payPayroll(@Param('id') id: string) { return this.hr.payPayroll(+id); }
}
