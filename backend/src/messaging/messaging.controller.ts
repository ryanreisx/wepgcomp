import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Channel, ConsumeMessage } from 'amqplib';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Controller()
export class MessagingController implements OnModuleInit {
  private readonly logger = new Logger(MessagingController.name);
  private transporter: Transporter;
  private smtpFrom: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD');

    this.smtpFrom = this.configService.get<string>(
      'SMTP_FROM',
      `"WEPGCOMP" <${user}>`,
    );

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    this.logger.log(`Gmail SMTP configured for ${user}`);
  }

  @MessagePattern('email-send')
  async handleEmailSend(
    @Payload() data: Record<string, unknown>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(`[email-send] Received: ${JSON.stringify(data)}`);
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: ConsumeMessage = context.getMessage() as ConsumeMessage;

    try {
      await this.sendEmail(data);
    } catch (error) {
      this.logger.error(`[email-send] Failed to send email: ${error}`);
    }

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

  private async sendEmail(data: Record<string, unknown>): Promise<void> {
    const { email, name, token, type } = data as {
      email: string;
      name: string;
      token: string;
      type?: string;
    };

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    let subject: string;
    let html: string;

    if (type === 'password-reset') {
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;
      subject = 'WEPGCOMP - Redefinição de senha';
      html = `
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p><a href="${resetLink}">Clique aqui para redefinir sua senha</a></p>
        <p>Se você não solicitou esta ação, ignore este e-mail.</p>
      `;
    } else {
      const verifyLink = `${frontendUrl}/verify-email?token=${token}`;
      subject = 'WEPGCOMP - Verificação de e-mail';
      html = `
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Obrigado por se cadastrar no WEPGCOMP.</p>
        <p><a href="${verifyLink}">Clique aqui para verificar seu e-mail</a></p>
      `;
    }

    await this.transporter.sendMail({
      from: this.smtpFrom,
      to: email,
      subject,
      html,
    });

    this.logger.log(`[email-send] Email sent to ${email}`);
  }
}
