import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Scheduler')
@Controller('scheduler')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulerController {
  constructor(private scheduler: SchedulerService) {}

  @Get('jobs') listJobs() { return this.scheduler.listJobs(); }
  @Get('jobs/:id') getJob(@Param('id') id: string) { return this.scheduler.getJob(+id); }
  @Post('jobs') createJob(@Body() body: any) { return this.scheduler.createJob(body); }
  @Patch('jobs/:id') updateJob(@Param('id') id: string, @Body() body: any) { return this.scheduler.updateJob(+id, body); }
  @Delete('jobs/:id') deleteJob(@Param('id') id: string) { return this.scheduler.deleteJob(+id); }
  @Post('jobs/:id/run') runNow(@Param('id') id: string) { return this.scheduler.runNow(+id); }
  @Post('seed') seedDefaults() { return this.scheduler.seedDefaultJobs(); }
}
