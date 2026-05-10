import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PresentationBlock, PresentationBlockType } from '@prisma/client';
import { PresentationBlockRepository } from './presentation-block.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { CreatePresentationBlockDto } from './dto/create-presentation-block.dto';
import { UpdatePresentationBlockDto } from './dto/update-presentation-block.dto';

@Injectable()
export class PresentationBlockService {
  constructor(
    private readonly repository: PresentationBlockRepository,
    private readonly eventEditionService: EventEditionService,
  ) {}

  async create(dto: CreatePresentationBlockDto): Promise<PresentationBlock> {
    const edition = await this.eventEditionService.findById(dto.eventEditionId);
    const startTime = new Date(dto.startTime);

    this.validateTimeWithinEvent(startTime, dto.duration, edition);
    this.validateDurationMultiple(dto.type, dto.duration, edition);

    const existingBlocks = await this.repository.findBlocksByEdition(
      dto.eventEditionId,
    );
    this.checkOverlap(
      startTime,
      dto.duration,
      dto.roomId ?? null,
      existingBlocks,
    );

    return this.repository.create({
      ...dto,
      startTime,
      roomId: dto.roomId ?? null,
    });
  }

  async findByEdition(eventEditionId: string): Promise<PresentationBlock[]> {
    return this.repository.findByEdition(eventEditionId);
  }

  async findById(id: string): Promise<PresentationBlock> {
    const block = await this.repository.findById(id);
    if (!block) {
      throw new NotFoundException('Presentation block not found');
    }
    return block;
  }

  async update(
    id: string,
    dto: UpdatePresentationBlockDto,
  ): Promise<PresentationBlock> {
    const existing = await this.findById(id);
    const editionId = dto.eventEditionId ?? existing.eventEditionId;
    const edition = await this.eventEditionService.findById(editionId);

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : existing.startTime;
    const duration = dto.duration ?? existing.duration;
    const type = dto.type ?? existing.type;
    const roomId =
      dto.roomId !== undefined ? (dto.roomId ?? null) : existing.roomId;

    this.validateTimeWithinEvent(startTime, duration, edition);
    this.validateDurationMultiple(type, duration, edition);

    const existingBlocks = await this.repository.findBlocksByEdition(
      editionId,
      id,
    );
    this.checkOverlap(startTime, duration, roomId, existingBlocks);

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.startTime) {
      updateData.startTime = new Date(dto.startTime);
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.deletePresentationsByBlock(id);
    await this.repository.clearProposedBlock(id);
    await this.repository.delete(id);
  }

  private validateTimeWithinEvent(
    startTime: Date,
    duration: number,
    edition: { startDate: Date; endDate: Date },
  ): void {
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    if (startTime < edition.startDate || endTime > edition.endDate) {
      throw new BadRequestException(
        'Block time must be within the event period',
      );
    }
  }

  private validateDurationMultiple(
    type: PresentationBlockType,
    duration: number,
    edition: { presentationDuration: number },
  ): void {
    if (
      type === PresentationBlockType.Presentation &&
      duration % edition.presentationDuration !== 0
    ) {
      throw new BadRequestException(
        `Duration must be a multiple of ${edition.presentationDuration} minutes for Presentation blocks`,
      );
    }
  }

  private checkOverlap(
    startTime: Date,
    duration: number,
    roomId: string | null,
    existingBlocks: PresentationBlock[],
  ): void {
    const newStart = startTime.getTime();
    const newEnd = newStart + duration * 60 * 1000;

    for (const block of existingBlocks) {
      const existStart = block.startTime.getTime();
      const existEnd = existStart + block.duration * 60 * 1000;

      if (newStart < existEnd && existStart < newEnd) {
        if (
          roomId === null ||
          block.roomId === null ||
          roomId === block.roomId
        ) {
          throw new ConflictException(
            'Time slot overlaps with an existing block',
          );
        }
      }
    }
  }
}
