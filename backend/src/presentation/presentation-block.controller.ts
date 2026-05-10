import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserLevel } from '@prisma/client';
import { PresentationBlockService } from './presentation-block.service';
import { CreatePresentationBlockDto } from './dto/create-presentation-block.dto';
import { UpdatePresentationBlockDto } from './dto/update-presentation-block.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('presentation-blocks')
export class PresentationBlockController {
  constructor(
    private readonly presentationBlockService: PresentationBlockService,
  ) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePresentationBlockDto) {
    const data = await this.presentationBlockService.create(dto);
    return { data, message: 'Presentation block created successfully' };
  }

  @Get()
  @Public()
  async findByEdition(@Query('eventEditionId') eventEditionId: string) {
    const data =
      await this.presentationBlockService.findByEdition(eventEditionId);
    return { data };
  }

  @Patch(':id')
  @Levels(UserLevel.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePresentationBlockDto,
  ) {
    const data = await this.presentationBlockService.update(id, dto);
    return { data, message: 'Presentation block updated successfully' };
  }

  @Delete(':id')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.presentationBlockService.delete(id);
  }
}
