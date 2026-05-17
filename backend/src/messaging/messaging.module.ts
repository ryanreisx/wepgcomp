import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('CLOUDAMQP_URL')!],
            queue: 'email-send',
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
