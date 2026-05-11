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
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { CreateEvaluationCriteriaDto } from './dto/create-evaluation-criteria.dto';
import { UpdateEvaluationCriteriaDto } from './dto/update-evaluation-criteria.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('evaluation-criteria')
export class EvaluationCriteriaController {
  constructor(private readonly service: EvaluationCriteriaService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEvaluationCriteriaDto) {
    const data = await this.service.create(dto);
    return { data, message: 'Evaluation criteria created successfully' };
  }

  @Get()
  @Public()
  async findByEdition(@Query('eventEditionId') eventEditionId: string) {
    const data = await this.service.findByEdition(eventEditionId);
    return { data };
  }

  @Patch(':id')
  @Levels(UserLevel.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationCriteriaDto,
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Evaluation criteria updated successfully' };
  }

  @Delete(':id')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
