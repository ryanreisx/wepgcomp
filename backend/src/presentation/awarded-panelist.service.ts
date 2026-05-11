import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AwardedPanelist } from '@prisma/client';
import { AwardedPanelistRepository } from './awarded-panelist.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { CreateAwardedPanelistDto } from './dto/create-awarded-panelist.dto';

const MAX_AWARDED_PANELISTS = 3;

@Injectable()
export class AwardedPanelistService {
  constructor(
    private readonly repository: AwardedPanelistRepository,
    private readonly eventEditionService: EventEditionService,
  ) {}

  async create(dto: CreateAwardedPanelistDto): Promise<AwardedPanelist> {
    await this.eventEditionService.findById(dto.eventEditionId);

    const userExists = await this.repository.userExists(dto.userId);
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.repository.findByEditionAndUser(
      dto.eventEditionId,
      dto.userId,
    );
    if (existing) {
      throw new ConflictException(
        'User is already an awarded panelist for this edition',
      );
    }

    const count = await this.repository.countByEdition(dto.eventEditionId);
    if (count >= MAX_AWARDED_PANELISTS) {
      throw new BadRequestException(
        `Cannot award more than ${MAX_AWARDED_PANELISTS} panelists per edition`,
      );
    }

    return this.repository.create(dto);
  }

  async findByEdition(eventEditionId: string): Promise<AwardedPanelist[]> {
    await this.eventEditionService.findById(eventEditionId);
    return this.repository.findByEdition(eventEditionId);
  }

  async remove(
    eventEditionId: string,
    userId: string,
  ): Promise<AwardedPanelist> {
    const existing = await this.repository.findByEditionAndUser(
      eventEditionId,
      userId,
    );
    if (!existing) {
      throw new NotFoundException('Awarded panelist not found');
    }
    return this.repository.delete(eventEditionId, userId);
  }
}
