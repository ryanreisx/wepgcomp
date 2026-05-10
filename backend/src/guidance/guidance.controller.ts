import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserLevel } from '@prisma/client';
import { GuidanceService } from './guidance.service';
import { CreateGuidanceDto } from './dto/create-guidance.dto';
import { UpdateGuidanceDto } from './dto/update-guidance.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('guidances')
export class GuidanceController {
  constructor(private readonly guidanceService: GuidanceService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGuidanceDto) {
    const data = await this.guidanceService.create(dto);
    return { data, message: 'Guidance created successfully' };
  }

  @Get(':eventEditionId')
  @Public()
  async findByEdition(@Param('eventEditionId') eventEditionId: string) {
    const data = await this.guidanceService.findByEdition(eventEditionId);
    return { data };
  }

  @Patch(':id')
  @Levels(UserLevel.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateGuidanceDto) {
    const data = await this.guidanceService.update(id, dto);
    return { data, message: 'Guidance updated successfully' };
  }
}
