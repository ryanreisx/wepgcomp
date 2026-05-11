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
import { AwardedPanelistService } from './awarded-panelist.service';
import { CreateAwardedPanelistDto } from './dto/create-awarded-panelist.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('awarded-panelists')
export class AwardedPanelistController {
  constructor(private readonly service: AwardedPanelistService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAwardedPanelistDto) {
    const data = await this.service.create(dto);
    return { data, message: 'Panelist awarded successfully' };
  }

  @Get()
  @Public()
  async findByEdition(@Query('eventEditionId') eventEditionId: string) {
    const data = await this.service.findByEdition(eventEditionId);
    return { data };
  }

  @Delete(':eventEditionId/:userId')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('eventEditionId') eventEditionId: string,
    @Param('userId') userId: string,
  ) {
    await this.service.remove(eventEditionId, userId);
  }
}
