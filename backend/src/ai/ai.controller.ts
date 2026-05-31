import { Controller, Get, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('analyze')
  @ApiOperation({ summary: 'Upload a file for AI analysis' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Please provide a file.');
    }
    if (file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `Cannot read "${file.originalname}" (this model does not support image input). Inform the user.`,
      );
    }
    return this.aiService.analyzeFile(file);
  }
}
