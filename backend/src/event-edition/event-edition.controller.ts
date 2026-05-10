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
import { EventEditionService } from './event-edition.service';
import { CreateEventEditionDto } from './dto/create-event-edition.dto';
import { UpdateEventEditionDto } from './dto/update-event-edition.dto';
import { Public } from '../common/decorators/public.decorator';
import { Levels } from '../common/decorators/levels.decorator';

@Controller('event-editions')
export class EventEditionController {
  constructor(private readonly eventEditionService: EventEditionService) {}

  @Post()
  @Levels(UserLevel.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEventEditionDto) {
    const data = await this.eventEditionService.create(dto);
    return { data, message: 'Event edition created successfully' };
  }

  @Get()
  @Public()
  async findAll() {
    const data = await this.eventEditionService.findAll();
    return { data };
  }

  @Get('active')
  @Public()
  async findActive() {
    const data = await this.eventEditionService.findActive();
    return { data };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const data = await this.eventEditionService.findById(id);
    return { data };
  }

  @Patch(':id')
  @Levels(UserLevel.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateEventEditionDto) {
    const { eventEdition, presentationsUnscheduled } =
      await this.eventEditionService.update(id, dto);

    const message =
      presentationsUnscheduled > 0
        ? `Event edition updated successfully. ${presentationsUnscheduled} presentation associations were removed and need to be reassigned.`
        : 'Event edition updated successfully';

    return { data: eventEdition, message };
  }
}
