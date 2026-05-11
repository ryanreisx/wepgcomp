import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Panelist } from '@prisma/client';

@Injectable()
export class PanelistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PanelistUncheckedCreateInput): Promise<Panelist> {
    return this.prisma.panelist.create({ data });
  }

  async findByBlock(presentationBlockId: string): Promise<Panelist[]> {
    return this.prisma.panelist.findMany({ where: { presentationBlockId } });
  }

  async findById(id: string): Promise<Panelist | null> {
    return this.prisma.panelist.findUnique({ where: { id } });
  }

  async findByBlockAndUser(
    presentationBlockId: string,
    userId: string,
  ): Promise<Panelist | null> {
    return this.prisma.panelist.findFirst({
      where: { presentationBlockId, userId },
    });
  }

  async delete(id: string): Promise<Panelist> {
    return this.prisma.panelist.delete({ where: { id } });
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }
}
