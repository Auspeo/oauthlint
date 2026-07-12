import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ruleid: auth.nestjs.cors-wildcard-credentials
  app.enableCors({ origin: '*', credentials: true });

  const app2 = await NestFactory.create(AppModule);
  // ruleid: auth.nestjs.cors-wildcard-credentials
  app2.enableCors({ credentials: true, origin: true });

  await app.listen(3000);
}
bootstrap();
