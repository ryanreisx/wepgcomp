import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Submission } from '@prisma/client';

@Injectable()
export class SubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.SubmissionUncheckedCreateInput,
  ): Promise<Submission> {
    return this.prisma.submission.create({ data });
  }

  async findAll(eventEditionId?: string): Promise<Submission[]> {
    const where = eventEditionId ? { eventEditionId } : {};
    return this.prisma.submission.findMany({ where });
  }

  async findById(id: string): Promise<Submission | null> {
    return this.prisma.submission.findUnique({ where: { id } });
  }

  async findByAuthor(mainAuthorId: string): Promise<Submission[]> {
    return this.prisma.submission.findMany({ where: { mainAuthorId } });
  }

  async update(
    id: string,
    data: Prisma.SubmissionUncheckedUpdateInput,
  ): Promise<Submission> {
    return this.prisma.submission.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Submission> {
    return this.prisma.submission.delete({ where: { id } });
  }

  async userExists(id: string): Promise<boolean> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }
}
