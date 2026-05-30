import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('AI Predictions')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('forecast')
  @ApiOperation({ summary: 'Get demand forecasts for all products' })
  getForecast() {
    return this.aiService.getDemandForecast();
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get anomaly alerts' })
  getAnomalies() {
    return this.aiService.getAnomalyAlerts();
  }
}
