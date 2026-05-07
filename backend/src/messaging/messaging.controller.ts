import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Channel, ConsumeMessage } from 'amqplib';

@Controller()
export class MessagingController {
  private readonly logger = new Logger(MessagingController.name);

  @MessagePattern('email-send')
  handleEmailSend(
    @Payload() data: Record<string, unknown>,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`[email-send] Received: ${JSON.stringify(data)}`);
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: ConsumeMessage = context.getMessage() as ConsumeMessage;
    channel.ack(originalMsg);
  }

  @MessagePattern('email-error')
  handleEmailError(
    @Payload() data: Record<string, unknown>,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`[email-error] Received: ${JSON.stringify(data)}`);
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: ConsumeMessage = context.getMessage() as ConsumeMessage;
    channel.ack(originalMsg);
  }

  @MessagePattern('email-rate-limit')
  handleEmailRateLimit(
    @Payload() data: Record<string, unknown>,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`[email-rate-limit] Received: ${JSON.stringify(data)}`);
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: ConsumeMessage = context.getMessage() as ConsumeMessage;
    channel.ack(originalMsg);
  }
}
