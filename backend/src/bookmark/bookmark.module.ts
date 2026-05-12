import { Module } from '@nestjs/common';
import { BookmarkController } from './bookmark.controller';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './bookmark.repository';

@Module({
  controllers: [BookmarkController],
  providers: [BookmarkService, BookmarkRepository],
  exports: [BookmarkService],
})
export class BookmarkModule {}
