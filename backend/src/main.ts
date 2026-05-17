import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.CLOUDAMQP_URL],
      queue: 'email-send',
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
