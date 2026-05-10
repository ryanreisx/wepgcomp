import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEdition } from '@prisma/client';
import { EventEditionRepository } from './event-edition.repository';
import { CreateEventEditionDto } from './dto/create-event-edition.dto';
import { UpdateEventEditionDto } from './dto/update-event-edition.dto';

export interface UpdateResult {
  eventEdition: EventEdition;
  presentationsUnscheduled: number;
}

@Injectable()
export class EventEditionService {
  constructor(private readonly repository: EventEditionRepository) {}

  async create(dto: CreateEventEditionDto): Promise<EventEdition> {
    this.validateDates(dto.submissionDeadline, dto.startDate);

    return this.repository.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      submissionStartDate: new Date(dto.submissionStartDate),
      submissionDeadline: new Date(dto.submissionDeadline),
      isActive: false,
    });
  }

  async findAll(): Promise<EventEdition[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<EventEdition> {
    const edition = await this.repository.findById(id);
    if (!edition) {
      throw new NotFoundException('Event edition not found');
    }
    return edition;
  }

  async findActive(): Promise<EventEdition> {
    const edition = await this.repository.findActive();
    if (!edition) {
      throw new NotFoundException('No active event edition found');
    }
    return edition;
  }

  async update(id: string, dto: UpdateEventEditionDto): Promise<UpdateResult> {
    const existing = await this.findById(id);

    if (dto.submissionDeadline || dto.startDate) {
      const deadline =
        dto.submissionDeadline ?? existing.submissionDeadline.toISOString();
      const start = dto.startDate ?? existing.startDate.toISOString();
      this.validateDates(deadline, start);
    }

    const scheduleChanged =
      (dto.presentationDuration !== undefined &&
        dto.presentationDuration !== existing.presentationDuration) ||
      (dto.presentationsPerPresentationBlock !== undefined &&
        dto.presentationsPerPresentationBlock !==
          existing.presentationsPerPresentationBlock);

    let presentationsUnscheduled = 0;

    if (scheduleChanged) {
      const cleared = await this.repository.clearSubmissionAssociations(id);
      const deleted = await this.repository.deletePresentationsByEdition(id);
      presentationsUnscheduled = cleared + deleted;
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.submissionStartDate)
      updateData.submissionStartDate = new Date(dto.submissionStartDate);
    if (dto.submissionDeadline)
      updateData.submissionDeadline = new Date(dto.submissionDeadline);

    const eventEdition = await this.repository.update(id, updateData);
    return { eventEdition, presentationsUnscheduled };
  }

  private validateDates(submissionDeadline: string, startDate: string): void {
    if (new Date(submissionDeadline) > new Date(startDate)) {
      throw new BadRequestException(
        'Submission deadline cannot be after the event start date',
      );
    }
  }
}
