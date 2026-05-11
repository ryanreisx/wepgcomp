import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwardedPanelist, Prisma } from '@prisma/client';

@Injectable()
export class AwardedPanelistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.AwardedPanelistUncheckedCreateInput,
  ): Promise<AwardedPanelist> {
    return this.prisma.awardedPanelist.create({ data });
  }

  async findByEdition(eventEditionId: string): Promise<AwardedPanelist[]> {
    return this.prisma.awardedPanelist.findMany({ where: { eventEditionId } });
  }

  async findByEditionAndUser(
    eventEditionId: string,
    userId: string,
  ): Promise<AwardedPanelist | null> {
    return this.prisma.awardedPanelist.findUnique({
      where: { eventEditionId_userId: { eventEditionId, userId } },
    });
  }

  async countByEdition(eventEditionId: string): Promise<number> {
    return this.prisma.awardedPanelist.count({ where: { eventEditionId } });
  }

  async delete(
    eventEditionId: string,
    userId: string,
  ): Promise<AwardedPanelist> {
    return this.prisma.awardedPanelist.delete({
      where: { eventEditionId_userId: { eventEditionId, userId } },
    });
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }
}
