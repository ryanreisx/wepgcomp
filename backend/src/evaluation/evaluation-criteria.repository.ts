import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, EvaluationCriteria } from '@prisma/client';

@Injectable()
export class EvaluationCriteriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.EvaluationCriteriaUncheckedCreateInput,
  ): Promise<EvaluationCriteria> {
    return this.prisma.evaluationCriteria.create({ data });
  }

  async findByEdition(eventEditionId: string): Promise<EvaluationCriteria[]> {
    return this.prisma.evaluationCriteria.findMany({
      where: { eventEditionId },
    });
  }

  async findById(id: string): Promise<EvaluationCriteria | null> {
    return this.prisma.evaluationCriteria.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.EvaluationCriteriaUpdateInput,
  ): Promise<EvaluationCriteria> {
    return this.prisma.evaluationCriteria.update({ where: { id }, data });
  }

  async delete(id: string): Promise<EvaluationCriteria> {
    return this.prisma.evaluationCriteria.delete({ where: { id } });
  }
}
