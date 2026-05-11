import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Evaluation } from '@prisma/client';

@Injectable()
export class EvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.EvaluationUncheckedCreateInput,
  ): Promise<Evaluation> {
    return this.prisma.evaluation.create({ data });
  }

  async findExisting(
    userId: string,
    submissionId: string,
    evaluationCriteriaId: string,
  ): Promise<Evaluation | null> {
    return this.prisma.evaluation.findFirst({
      where: { userId, submissionId, evaluationCriteriaId },
    });
  }

  async update(
    id: string,
    data: Prisma.EvaluationUpdateInput,
  ): Promise<Evaluation> {
    return this.prisma.evaluation.update({ where: { id }, data });
  }

  async findBySubmission(submissionId: string): Promise<Evaluation[]> {
    return this.prisma.evaluation.findMany({ where: { submissionId } });
  }
}
