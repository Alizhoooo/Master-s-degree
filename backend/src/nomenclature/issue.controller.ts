import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IssueService } from './issue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Issues')
@Controller('issues')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('warehouse.write')
@ApiBearerAuth()
export class IssueController {
  constructor(private issues: IssueService) {}

  @Get()
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  list(
    @Query('warehouseId') warehouseId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.issues.list({
      warehouseId: warehouseId ? +warehouseId : undefined,
      type, status, dateFrom, dateTo,
    });
  }

  @Get(':id') get(@Param('id') id: string) { return this.issues.get(+id); }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.issues.create({ ...body, userId: req.user.id });
  }
}
