import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Certificate, Prisma } from '@prisma/client';

@Injectable()
export class CertificateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.CertificateUncheckedCreateInput,
  ): Promise<Certificate> {
    return this.prisma.certificate.create({ data });
  }

  async findById(id: string): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({ where: { id } });
  }

  async findByUser(userId: string): Promise<Certificate[]> {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { eventEdition: true },
    });
  }

  async findByEditionAndUser(
    eventEditionId: string,
    userId: string,
  ): Promise<Certificate | null> {
    return this.prisma.certificate.findFirst({
      where: { eventEditionId, userId },
    });
  }

  async deleteByEdition(eventEditionId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.certificate.deleteMany({ where: { eventEditionId } });
  }

  async getParticipants(eventEditionId: string) {
    const presenters = await this.prisma.userAccount.findMany({
      where: {
        authoredSubmissions: {
          some: {
            eventEditionId,
            presentation: { isNot: null },
          },
        },
      },
      select: { id: true, name: true, email: true, profile: true },
    });

    const panelists = await this.prisma.userAccount.findMany({
      where: {
        panelists: {
          some: {
            presentationBlock: { eventEditionId },
            status: 'Confirmed',
          },
        },
      },
      select: { id: true, name: true, email: true, profile: true },
    });

    const participantMap = new Map<
      string,
      { id: string; name: string; email: string; profile: string }
    >();
    for (const p of [...presenters, ...panelists]) {
      if (!participantMap.has(p.id)) {
        participantMap.set(p.id, p);
      }
    }

    return Array.from(participantMap.values());
  }

  async getPresentationsWithScores(eventEditionId: string) {
    return this.prisma.presentation.findMany({
      where: {
        submission: { eventEditionId },
      },
      include: {
        submission: {
          include: { mainAuthor: { select: { id: true, name: true } } },
        },
        presentationBlock: {
          include: {
            panelists: { select: { userId: true } },
          },
        },
      },
    });
  }

  async getAwardedPanelists(eventEditionId: string) {
    return this.prisma.awardedPanelist.findMany({
      where: { eventEditionId },
    });
  }
}
