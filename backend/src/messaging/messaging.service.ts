import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private amqplib = amqplib;
  private readonly cloudamqpUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudamqpUrl = this.configService.get<string>('CLOUDAMQP_URL')!;
  }

  async publish(queue: string, data: unknown): Promise<void> {
    const connection = await this.amqplib.connect(this.cloudamqpUrl);
    try {
      const channel = await connection.createChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
        persistent: true,
      });
      this.logger.log(`Message published to queue "${queue}"`);
    } finally {
      await connection.close();
    }
  }
}
