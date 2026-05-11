import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserLevel } from '@prisma/client';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly service: EvaluationService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user?: { sub: string },
  ) {
    const data = await this.service.create(dto, user?.sub);
    return { data, message: 'Evaluation submitted successfully' };
  }

  @Get()
  @Levels(UserLevel.Admin)
  async findBySubmission(@Query('submissionId') submissionId: string) {
    const data = await this.service.findBySubmission(submissionId);
    return { data };
  }
}
