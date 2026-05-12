import { Injectable, NotFoundException } from '@nestjs/common';
import { BookmarkRepository } from './bookmark.repository';

@Injectable()
export class BookmarkService {
  constructor(private readonly repository: BookmarkRepository) {}

  async add(userId: string, presentationId: string) {
    const presentation =
      await this.repository.findPresentationById(presentationId);
    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }

    return this.repository.addBookmark(userId, presentationId);
  }

  async remove(userId: string, presentationId: string) {
    const presentation =
      await this.repository.findPresentationById(presentationId);
    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }

    await this.repository.removeBookmark(userId, presentationId);
  }

  async findByUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  async isBookmarked(userId: string, presentationId: string): Promise<boolean> {
    return this.repository.isBookmarked(userId, presentationId);
  }
}
