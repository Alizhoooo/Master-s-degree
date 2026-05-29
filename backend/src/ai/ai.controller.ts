import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('forecast')
  getForecast() {
    return this.aiService.getDemandForecast();
  }

  @Get('anomalies')
  getAnomalies() {
    return this.aiService.getAnomalyAlerts();
  }
}
