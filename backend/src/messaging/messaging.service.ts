import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @Inject('EMAIL_SERVICE') private readonly client: ClientProxy,
  ) {}

  async publish(queue: string, data: unknown): Promise<void> {
    await lastValueFrom(this.client.emit(queue, data));
    this.logger.log(`Message published to queue "${queue}"`);
  }
}
