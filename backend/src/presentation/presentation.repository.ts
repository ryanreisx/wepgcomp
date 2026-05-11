import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  Presentation,
  Submission,
  Evaluation,
  UserAccount,
  Panelist,
  PresentationBlock,
} from '@prisma/client';

export type PresentationWithSubmission = Presentation & {
  submission: Submission;
};

export type PresentationWithEvaluationData = Presentation & {
  submission: Submission & {
    mainAuthor: Pick<UserAccount, 'name'>;
    evaluations: Evaluation[];
  };
  presentationBlock: PresentationBlock & {
    panelists: Pick<Panelist, 'userId'>[];
  };
};

@Injectable()
export class PresentationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.PresentationUncheckedCreateInput,
  ): Promise<Presentation> {
    return this.prisma.presentation.create({ data });
  }

  async findByEdition(
    eventEditionId: string,
  ): Promise<PresentationWithSubmission[]> {
    return this.prisma.presentation.findMany({
      where: { presentationBlock: { eventEditionId } },
      include: { submission: true },
    });
  }

  async findById(id: string): Promise<Presentation | null> {
    return this.prisma.presentation.findUnique({ where: { id } });
  }

  async findBySubmission(submissionId: string): Promise<Presentation | null> {
    return this.prisma.presentation.findUnique({ where: { submissionId } });
  }

  async update(
    id: string,
    data: Prisma.PresentationUncheckedUpdateInput,
  ): Promise<Presentation> {
    return this.prisma.presentation.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Presentation> {
    return this.prisma.presentation.delete({ where: { id } });
  }

  async submissionExists(submissionId: string): Promise<boolean> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    });
    return !!submission;
  }

  async findByEditionWithEvaluations(
    eventEditionId: string,
  ): Promise<PresentationWithEvaluationData[]> {
    return this.prisma.presentation.findMany({
      where: { presentationBlock: { eventEditionId } },
      include: {
        submission: {
          include: {
            mainAuthor: { select: { name: true } },
            evaluations: true,
          },
        },
        presentationBlock: {
          include: {
            panelists: { select: { userId: true } },
          },
        },
      },
    });
  }

  async updateScores(
    id: string,
    publicAverageScore: number,
    evaluatorsAverageScore: number,
  ): Promise<Presentation> {
    return this.prisma.presentation.update({
      where: { id },
      data: { publicAverageScore, evaluatorsAverageScore },
    });
  }
}
