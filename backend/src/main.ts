import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { appValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('v1');
  const configuredOrigins = config.get<string[]>('corsOrigins', [
    'http://localhost:3000',
  ]);
  const isDevelopment =
    config.get<string>('nodeEnv', 'development') !== 'production';
  const allowVercelOrigins = config.get<boolean>('allowVercelOrigins', true);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      const cleanOrigin = requestOrigin.replace(/\/+$/, '');
      const isConfigured =
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(cleanOrigin);
      const isVercelPreview =
        allowVercelOrigins && cleanOrigin.endsWith('.vercel.app');
      const isManusPreview =
        isDevelopment &&
        (cleanOrigin.endsWith('.manus.computer') ||
          cleanOrigin.endsWith('.manus.im'));
      callback(null, isConfigured || isVercelPreview || isManusPreview);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-idempotency-key',
      'x-correlation-id',
    ],
  });
  app.useGlobalPipes(appValidationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  await app.listen(config.get<number>('port', 3001), '0.0.0.0');
}

void bootstrap();
