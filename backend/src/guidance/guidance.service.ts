import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Guidance } from '@prisma/client';
import { GuidanceRepository } from './guidance.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { CreateGuidanceDto } from './dto/create-guidance.dto';
import { UpdateGuidanceDto } from './dto/update-guidance.dto';

@Injectable()
export class GuidanceService {
  constructor(
    private readonly repository: GuidanceRepository,
    private readonly eventEditionService: EventEditionService,
  ) {}

  async create(dto: CreateGuidanceDto): Promise<Guidance> {
    await this.eventEditionService.findById(dto.eventEditionId);

    const existing = await this.repository.findByEdition(dto.eventEditionId);
    if (existing) {
      throw new ConflictException(
        'Guidance already exists for this event edition',
      );
    }

    return this.repository.create(dto);
  }

  async findByEdition(eventEditionId: string): Promise<Guidance> {
    await this.eventEditionService.findById(eventEditionId);

    const guidance = await this.repository.findByEdition(eventEditionId);
    if (!guidance) {
      throw new NotFoundException('Guidance not found for this event edition');
    }
    return guidance;
  }

  async update(id: string, dto: UpdateGuidanceDto): Promise<Guidance> {
    const guidance = await this.repository.findById(id);
    if (!guidance) {
      throw new NotFoundException('Guidance not found');
    }
    return this.repository.update(id, dto);
  }
}
