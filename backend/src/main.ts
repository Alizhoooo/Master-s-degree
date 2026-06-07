import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: isProd ? 0.2 : 1.0,
  });

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const corsOrigin = configService.get<string[]>('app.corsOrigin') || [];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (corsOrigin.length === 0) return callback(null, true);
      if (corsOrigin.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api/v1');

  // Swagger — disabled in production or restricted
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SupplyFlow API')
      .setDescription('SupplyFlow Business Process Management System')
      .setVersion('v1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document);
    logger.log(`Swagger docs: http://localhost:${configService.get<number>('app.port', 3001)}/api/v1/docs`);
  } else {
    logger.log('Swagger disabled in production');
  }

  const port = configService.get<number>('app.port', 3001);
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
}
bootstrap();
