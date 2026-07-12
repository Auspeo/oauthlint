import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ok: auth.nestjs.cors-wildcard-credentials -- explicit allowlist + credentials
  app.enableCors({
    origin: ['https://app.example.com', 'https://admin.example.com'],
    credentials: true,
  });

  const app2 = await NestFactory.create(AppModule);
  // ok: auth.nestjs.cors-wildcard-credentials -- public API, credentials stays off
  app2.enableCors({ origin: '*' });

  const app3 = await NestFactory.create(AppModule);
  // ok: auth.nestjs.cors-wildcard-credentials -- single trusted origin string
  app3.enableCors({ origin: 'https://app.example.com', credentials: true });

  await app.listen(3000);
}
bootstrap();
