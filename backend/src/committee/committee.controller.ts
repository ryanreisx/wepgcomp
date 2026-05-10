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
import { CommitteeService } from './committee.service';
import { CreateCommitteeMemberDto } from './dto/create-committee-member.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('committee-members')
export class CommitteeController {
  constructor(private readonly committeeService: CommitteeService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCommitteeMemberDto,
    @CurrentUser() caller: { sub: string; level: UserLevel },
  ) {
    const data = await this.committeeService.create(dto, caller.level);
    return { data, message: 'Committee member added successfully' };
  }

  @Get()
  @Public()
  async findByEdition(@Query('eventEditionId') eventEditionId: string) {
    const data = await this.committeeService.findByEdition(eventEditionId);
    return { data };
  }

  @Delete(':id')
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.committeeService.remove(id);
  }
}
