import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Guidance } from '@prisma/client';

@Injectable()
export class GuidanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GuidanceUncheckedCreateInput): Promise<Guidance> {
    return this.prisma.guidance.create({ data });
  }

  async findByEdition(eventEditionId: string): Promise<Guidance | null> {
    return this.prisma.guidance.findUnique({ where: { eventEditionId } });
  }

  async findById(id: string): Promise<Guidance | null> {
    return this.prisma.guidance.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.GuidanceUpdateInput,
  ): Promise<Guidance> {
    return this.prisma.guidance.update({ where: { id }, data });
  }
}
