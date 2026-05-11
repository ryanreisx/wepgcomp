import { Injectable, NotFoundException } from '@nestjs/common';
import { EvaluationCriteria } from '@prisma/client';
import { EvaluationCriteriaRepository } from './evaluation-criteria.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { CreateEvaluationCriteriaDto } from './dto/create-evaluation-criteria.dto';
import { UpdateEvaluationCriteriaDto } from './dto/update-evaluation-criteria.dto';

@Injectable()
export class EvaluationCriteriaService {
  constructor(
    private readonly repository: EvaluationCriteriaRepository,
    private readonly eventEditionService: EventEditionService,
  ) {}

  async create(dto: CreateEvaluationCriteriaDto): Promise<EvaluationCriteria> {
    await this.eventEditionService.findById(dto.eventEditionId);
    return this.repository.create(dto);
  }

  async findByEdition(eventEditionId: string): Promise<EvaluationCriteria[]> {
    await this.eventEditionService.findById(eventEditionId);
    return this.repository.findByEdition(eventEditionId);
  }

  async findById(id: string): Promise<EvaluationCriteria> {
    const criteria = await this.repository.findById(id);
    if (!criteria) {
      throw new NotFoundException('Evaluation criteria not found');
    }
    return criteria;
  }

  async update(
    id: string,
    dto: UpdateEvaluationCriteriaDto,
  ): Promise<EvaluationCriteria> {
    await this.findById(id);
    if (dto.eventEditionId) {
      await this.eventEditionService.findById(dto.eventEditionId);
    }
    return this.repository.update(id, dto);
  }

  async remove(id: string): Promise<EvaluationCriteria> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
