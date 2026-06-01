import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private tasks: TaskService) {}

  @Get('mine') listMyTasks(@Request() req) { return this.tasks.listMyTasks(req.user.id); }

  @Get()
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'createdById', required: false })
  @ApiQuery({ name: 'status', required: false })
  listTasks(
    @Query('assignedToId') assignedToId?: string,
    @Query('createdById') createdById?: string,
    @Query('status') status?: string,
  ) {
    return this.tasks.listTasks({
      assignedToId: assignedToId ? +assignedToId : undefined,
      createdById: createdById ? +createdById : undefined,
      status,
    });
  }

  @Get(':id') getTask(@Param('id') id: string) { return this.tasks.getTask(+id); }
  @Post() createTask(@Body() body: any, @Request() req) { return this.tasks.createTask({ ...body, createdById: body.createdById || req.user.id }); }
  @Patch(':id') updateTask(@Param('id') id: string, @Body() body: any) { return this.tasks.updateTask(+id, body); }
  @Patch(':id/start') startTask(@Param('id') id: string) { return this.tasks.startTask(+id); }
  @Patch(':id/complete') completeTask(@Param('id') id: string) { return this.tasks.completeTask(+id); }
  @Patch(':id/cancel') cancelTask(@Param('id') id: string) { return this.tasks.cancelTask(+id); }
  @Delete(':id') deleteTask(@Param('id') id: string) { return this.tasks.deleteTask(+id); }
}
