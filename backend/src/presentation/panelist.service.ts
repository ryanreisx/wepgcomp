import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Panelist } from '@prisma/client';
import { PanelistRepository } from './panelist.repository';
import { PresentationBlockService } from './presentation-block.service';
import { CreatePanelistDto } from './dto/create-panelist.dto';

@Injectable()
export class PanelistService {
  constructor(
    private readonly repository: PanelistRepository,
    private readonly presentationBlockService: PresentationBlockService,
  ) {}

  async create(dto: CreatePanelistDto): Promise<Panelist> {
    await this.presentationBlockService.findById(dto.presentationBlockId);

    const userExists = await this.repository.userExists(dto.userId);
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.repository.findByBlockAndUser(
      dto.presentationBlockId,
      dto.userId,
    );
    if (existing) {
      throw new ConflictException(
        'User is already assigned as panelist for this block',
      );
    }

    return this.repository.create(dto);
  }

  async findByBlock(presentationBlockId: string): Promise<Panelist[]> {
    return this.repository.findByBlock(presentationBlockId);
  }

  async delete(id: string): Promise<void> {
    const panelist = await this.repository.findById(id);
    if (!panelist) {
      throw new NotFoundException('Panelist not found');
    }
    await this.repository.delete(id);
  }
}
