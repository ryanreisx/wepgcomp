import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PresentationBlock } from '@prisma/client';

@Injectable()
export class PresentationBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.PresentationBlockUncheckedCreateInput,
  ): Promise<PresentationBlock> {
    return this.prisma.presentationBlock.create({ data });
  }

  async findByEdition(eventEditionId: string): Promise<PresentationBlock[]> {
    return this.prisma.presentationBlock.findMany({
      where: { eventEditionId },
    });
  }

  async findById(id: string): Promise<PresentationBlock | null> {
    return this.prisma.presentationBlock.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.PresentationBlockUncheckedUpdateInput,
  ): Promise<PresentationBlock> {
    return this.prisma.presentationBlock.update({ where: { id }, data });
  }

  async delete(id: string): Promise<PresentationBlock> {
    return this.prisma.presentationBlock.delete({ where: { id } });
  }

  async findBlocksByEdition(
    eventEditionId: string,
    excludeId?: string,
  ): Promise<PresentationBlock[]> {
    const where: Prisma.PresentationBlockWhereInput = { eventEditionId };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return this.prisma.presentationBlock.findMany({ where });
  }

  async deletePresentationsByBlock(blockId: string): Promise<number> {
    const result = await this.prisma.presentation.deleteMany({
      where: { presentationBlockId: blockId },
    });
    return result.count;
  }

  async clearProposedBlock(blockId: string): Promise<number> {
    const result = await this.prisma.submission.updateMany({
      where: { proposedPresentationBlockId: blockId },
      data: {
        proposedPresentationBlockId: null,
        proposedPositionWithinBlock: null,
      },
    });
    return result.count;
  }
}
