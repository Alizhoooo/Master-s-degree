import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppLogger } from './logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private logger: AppLogger) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully', 'PrismaService');
  }
}
