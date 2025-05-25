import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as config from 'config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const whitelist = config.get<string[]>('origin');
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  });
  const port = process.env.PORT || config.get('server.port');
  process.env.TZ = "America/Sao_Paulo";

  console.log(`Port:${port} ---`, new Date().toString());
  await app.listen(port);
}
bootstrap();
