import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  CommitteeMember,
  CommitteeLevel,
  CommitteeRole,
} from '@prisma/client';

@Injectable()
export class CommitteeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.CommitteeMemberUncheckedCreateInput,
  ): Promise<CommitteeMember> {
    return this.prisma.committeeMember.create({ data });
  }

  async findByEdition(eventEditionId: string): Promise<CommitteeMember[]> {
    return this.prisma.committeeMember.findMany({ where: { eventEditionId } });
  }

  async findById(id: string): Promise<CommitteeMember | null> {
    return this.prisma.committeeMember.findUnique({ where: { id } });
  }

  async findByEditionAndUser(
    eventEditionId: string,
    userId: string,
  ): Promise<CommitteeMember | null> {
    return this.prisma.committeeMember.findUnique({
      where: { eventEditionId_userId: { eventEditionId, userId } },
    });
  }

  async findCoordinator(
    eventEditionId: string,
  ): Promise<CommitteeMember | null> {
    return this.prisma.committeeMember.findFirst({
      where: {
        eventEditionId,
        level: CommitteeLevel.Coordinator,
        role: CommitteeRole.Organizer,
      },
    });
  }

  async delete(id: string): Promise<CommitteeMember> {
    return this.prisma.committeeMember.delete({ where: { id } });
  }
}
