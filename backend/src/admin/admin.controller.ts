import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  createUser(@Body() body: { email: string; password: string; fullName: string; role: string }) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(+id, body.role);
  }

  @Get('config/:key')
  @ApiOperation({ summary: 'Get configuration value' })
  @ApiParam({ name: 'key', type: String })
  getConfig(@Param('key') key: string) {
    return this.adminService.getConfig(key);
  }

  @Post('config')
  @ApiOperation({ summary: 'Set configuration value' })
  setConfig(@Body() body: { key: string; value: string }) {
    return this.adminService.setConfig(body.key, body.value);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get system audit logs' })
  getSystemLogs() {
    return this.adminService.getSystemLogs();
  }
}
