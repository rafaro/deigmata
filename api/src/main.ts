import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as config from 'config';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe
} from 'nestjs-i18n';
import { I18nService } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const i18n = app.get<I18nService<Record<string, unknown>>>(I18nService);
  const corsNotAllowed = i18n.t('msg.cors.notAllowed');

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
    })
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    })
  );

  const whitelist = config.get<string[]>('origin');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(corsNotAllowed));
      }
    },
    credentials: true,
  });

  const port = config.get<number>('server.port');
  const timezone = config.has('server.timezone')
    ? config.get<string>('server.timezone')
    : 'America/Sao_Paulo';

  process.env.TZ = timezone;

  const logger = new Logger('Bootstrap');
  logger.log(`[SERVER] port=${port} | tz=${timezone} | started=${new Date().toISOString()}`);
  await app.listen(port);
}

bootstrap();
