import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CommitteeLevel } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { EventEditionService } from '../event-edition/event-edition.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly eventEditionService: EventEditionService,
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  async send(dto: CreateContactDto) {
    let edition;
    try {
      edition = await this.eventEditionService.findActive();
    } catch {
      throw new ServiceUnavailableException(
        'Formulário indisponível no momento',
      );
    }

    const coordinator = await this.prisma.committeeMember.findFirst({
      where: {
        eventEditionId: edition.id,
        level: CommitteeLevel.Coordinator,
      },
      include: { user: { select: { email: true } } },
    });

    if (!coordinator) {
      throw new ServiceUnavailableException(
        'Formulário indisponível no momento',
      );
    }

    await this.messagingService.publish('email-send', {
      to: coordinator.user.email,
      from: dto.email,
      subject: `Contato via portal — ${dto.name}`,
      body: dto.message,
      replyTo: dto.email,
    });

    return { message: 'Mensagem enviada com sucesso' };
  }
}
