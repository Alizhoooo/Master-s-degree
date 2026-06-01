import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notifications: NotificationService) {}

  @Get()
  @ApiQuery({ name: 'unread', required: false })
  list(@Request() req, @Query('unread') unread?: string) {
    return this.notifications.listMy(req.user.id, unread === 'true');
  }

  @Get('unread-count')
  unreadCount(@Request() req) { return this.notifications.unreadCount(req.user.id); }

  @Post()
  create(@Body() body: { userId: number; title: string; message: string; type?: string; link?: string }) {
    return this.notifications.create(body.userId, body.title, body.message, body.type, body.link);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req) { return this.notifications.markRead(+id, req.user.id); }

  @Patch('read-all')
  markAllRead(@Request() req) { return this.notifications.markAllRead(req.user.id); }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) { return this.notifications.delete(+id, req.user.id); }
}
