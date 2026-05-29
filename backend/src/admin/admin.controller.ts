import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Post('users')
  createUser(@Body() body: { email: string; password: string; fullName: string; role: string }) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(+id, body.role);
  }

  @Get('config/:key')
  getConfig(@Param('key') key: string) {
    return this.adminService.getConfig(key);
  }

  @Post('config')
  setConfig(@Body() body: { key: string; value: string }) {
    return this.adminService.setConfig(body.key, body.value);
  }

  @Get('logs')
  getSystemLogs() {
    return this.adminService.getSystemLogs();
  }
}
