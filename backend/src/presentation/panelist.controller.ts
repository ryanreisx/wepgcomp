import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserLevel } from '@prisma/client';
import { PanelistService } from './panelist.service';
import { CreatePanelistDto } from './dto/create-panelist.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('panelists')
export class PanelistController {
  constructor(private readonly panelistService: PanelistService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePanelistDto) {
    const data = await this.panelistService.create(dto);
    return { data, message: 'Panelist assigned successfully' };
  }

  @Get()
  @Public()
  async findByBlock(@Query('presentationBlockId') presentationBlockId: string) {
    const data = await this.panelistService.findByBlock(presentationBlockId);
    return { data };
  }

  @Delete(':id')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.panelistService.delete(id);
  }
}
