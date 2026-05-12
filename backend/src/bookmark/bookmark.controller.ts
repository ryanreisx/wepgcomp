import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('presentations')
export class BookmarkController {
  constructor(private readonly service: BookmarkService) {}

  @Post(':presentationId/bookmark')
  @HttpCode(HttpStatus.CREATED)
  async add(
    @Param('presentationId') presentationId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const data = await this.service.add(user.sub, presentationId);
    return { data, message: 'Presentation bookmarked successfully' };
  }

  @Delete(':presentationId/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('presentationId') presentationId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.service.remove(user.sub, presentationId);
  }

  @Get('bookmarks/my')
  async findMy(@CurrentUser() user: { sub: string }) {
    const data = await this.service.findByUser(user.sub);
    return { data };
  }

  @Get(':presentationId/bookmark/check')
  async check(
    @Param('presentationId') presentationId: string,
    @CurrentUser() user: { sub: string },
  ) {
    const isBookmarked = await this.service.isBookmarked(
      user.sub,
      presentationId,
    );
    return { data: { isBookmarked } };
  }
}
