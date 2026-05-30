import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import * as os from 'os';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private prisma = new PrismaClient();

  @Get()
  @ApiOperation({ summary: 'Check system health status' })
  async check() {
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'unhealthy';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      },
      os: {
        hostname: os.hostname(),
        platform: os.platform(),
        cpuLoad: os.loadavg()[0],
      },
    };
  }
}
