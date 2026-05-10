import { Injectable, NotFoundException } from '@nestjs/common';
import { Presentation } from '@prisma/client';
import {
  PresentationRepository,
  PresentationWithSubmission,
} from './presentation.repository';
import { PresentationBlockService } from './presentation-block.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';

@Injectable()
export class PresentationService {
  constructor(
    private readonly repository: PresentationRepository,
    private readonly presentationBlockService: PresentationBlockService,
  ) {}

  async create(dto: CreatePresentationDto): Promise<Presentation> {
    const submissionExists = await this.repository.submissionExists(
      dto.submissionId,
    );
    if (!submissionExists) {
      throw new NotFoundException('Submission not found');
    }

    await this.presentationBlockService.findById(dto.presentationBlockId);

    const existing = await this.repository.findBySubmission(dto.submissionId);
    if (existing) {
      await this.repository.delete(existing.id);
    }

    return this.repository.create(dto);
  }

  async findByEdition(
    eventEditionId: string,
  ): Promise<PresentationWithSubmission[]> {
    return this.repository.findByEdition(eventEditionId);
  }

  async findById(id: string): Promise<Presentation> {
    const presentation = await this.repository.findById(id);
    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }
    return presentation;
  }

  async update(id: string, dto: UpdatePresentationDto): Promise<Presentation> {
    await this.findById(id);

    if (dto.presentationBlockId) {
      await this.presentationBlockService.findById(dto.presentationBlockId);
    }

    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}
