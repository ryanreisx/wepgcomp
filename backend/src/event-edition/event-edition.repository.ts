import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, EventEdition } from '@prisma/client';

@Injectable()
export class EventEditionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.EventEditionCreateInput): Promise<EventEdition> {
    return this.prisma.eventEdition.create({ data });
  }

  async findAll(): Promise<EventEdition[]> {
    return this.prisma.eventEdition.findMany();
  }

  async findById(id: string): Promise<EventEdition | null> {
    return this.prisma.eventEdition.findUnique({ where: { id } });
  }

  async findActive(): Promise<EventEdition | null> {
    return this.prisma.eventEdition.findFirst({ where: { isActive: true } });
  }

  async update(
    id: string,
    data: Prisma.EventEditionUpdateInput,
  ): Promise<EventEdition> {
    return this.prisma.eventEdition.update({ where: { id }, data });
  }

  async clearSubmissionAssociations(eventEditionId: string): Promise<number> {
    const result = await this.prisma.submission.updateMany({
      where: { eventEditionId },
      data: {
        proposedPresentationBlockId: null,
        proposedPositionWithinBlock: null,
      },
    });
    return result.count;
  }

  async deletePresentationsByEdition(eventEditionId: string): Promise<number> {
    const result = await this.prisma.presentation.deleteMany({
      where: {
        presentationBlock: { eventEditionId },
      },
    });
    return result.count;
  }
}
