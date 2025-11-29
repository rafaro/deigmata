import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as config from 'config';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || config.get('server.port');
  process.env.TZ = 'America/Sao_Paulo';

  console.log(`Port: ${port} ---`, new Date().toString());
  await app.listen(port);
}

bootstrap();