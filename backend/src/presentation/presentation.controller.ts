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
import { PresentationService } from './presentation.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('presentations')
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePresentationDto) {
    const data = await this.presentationService.create(dto);
    return { data, message: 'Presentation allocated successfully' };
  }

  @Get('ranking')
  @Public()
  async getRanking(
    @Query('eventEditionId') eventEditionId: string,
    @Query('type') type: 'public' | 'panelists' | 'all',
  ) {
    const data = await this.presentationService.getRanking(
      eventEditionId,
      type,
    );
    return { data };
  }

  @Get()
  @Public()
  async findByEdition(@Query('eventEditionId') eventEditionId: string) {
    const data = await this.presentationService.findByEdition(eventEditionId);
    return { data };
  }

  @Patch(':id')
  @Levels(UserLevel.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdatePresentationDto) {
    const data = await this.presentationService.update(id, dto);
    return { data, message: 'Presentation updated successfully' };
  }

  @Delete(':id')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.presentationService.delete(id);
  }
}
