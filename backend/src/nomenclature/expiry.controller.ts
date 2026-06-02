import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpiryService } from './expiry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassPermissionsGuard, RequirePermissions } from '../rbac/rbac.guard';

@ApiTags('Expiry')
@Controller('expiry')
@UseGuards(JwtAuthGuard, ClassPermissionsGuard)
@RequirePermissions('warehouse.access')
@ApiBearerAuth()
export class ExpiryController {
  constructor(private expiry: ExpiryService) {}

  @Post('scan') scan() { return this.expiry.scan(); }

  @Get('alerts')
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'includeResolved', required: false })
  alerts(
    @Query('severity') severity?: string,
    @Query('includeResolved') includeResolved?: string,
  ) {
    return this.expiry.alerts({
      severity,
      includeResolved: includeResolved === 'true',
    });
  }

  @Get('expiring-soon')
  @ApiQuery({ name: 'days', required: false })
  expiringSoon(@Query('days') days?: string) {
    return this.expiry.expiringSoon(days ? +days : 30);
  }

  @Get('expired') expired() { return this.expiry.expired(); }

  @Patch('alerts/:id/resolve')
  resolve(@Param('id') id: string) { return this.expiry.resolve(+id); }
}
