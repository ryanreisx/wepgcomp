import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Presentation } from '@prisma/client';

@Injectable()
export class BookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPresentationById(id: string): Promise<Presentation | null> {
    return this.prisma.presentation.findUnique({ where: { id } });
  }

  async addBookmark(userId: string, presentationId: string) {
    return this.prisma.presentation.update({
      where: { id: presentationId },
      data: {
        bookmarkedUsers: { connect: { id: userId } },
      },
    });
  }

  async removeBookmark(userId: string, presentationId: string) {
    await this.prisma.presentation.update({
      where: { id: presentationId },
      data: {
        bookmarkedUsers: { disconnect: { id: userId } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.presentation.findMany({
      where: {
        bookmarkedUsers: { some: { id: userId } },
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            mainAuthor: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async isBookmarked(userId: string, presentationId: string): Promise<boolean> {
    const count = await this.prisma.presentation.count({
      where: {
        id: presentationId,
        bookmarkedUsers: { some: { id: userId } },
      },
    });
    return count > 0;
  }
}
