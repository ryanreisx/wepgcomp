import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Evaluation } from '@prisma/client';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EventEditionService } from '../event-edition/event-edition.service';
import { SubmissionService } from '../submission/submission.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly repository: EvaluationRepository,
    private readonly evaluationCriteriaService: EvaluationCriteriaService,
    private readonly eventEditionService: EventEditionService,
    private readonly submissionService: SubmissionService,
  ) {}

  async create(dto: CreateEvaluationDto, userId?: string): Promise<Evaluation> {
    const submission = await this.submissionService.findById(dto.submissionId);
    const edition = await this.eventEditionService.findById(
      submission.eventEditionId,
    );

    if (edition.isEvaluationRestrictToLoggedUsers && !userId) {
      throw new UnauthorizedException(
        'Authentication required to vote in this edition',
      );
    }

    const now = new Date();
    if (now < edition.startDate || now > edition.endDate) {
      throw new BadRequestException(
        'Voting is not open for this event edition',
      );
    }

    await this.evaluationCriteriaService.findById(dto.evaluationCriteriaId);

    if (userId) {
      const existing = await this.repository.findExisting(
        userId,
        dto.submissionId,
        dto.evaluationCriteriaId,
      );
      if (existing) {
        return this.repository.update(existing.id, {
          score: dto.score,
          comments: dto.comments,
        });
      }
    }

    return this.repository.create({
      ...dto,
      userId: userId ?? null,
    });
  }

  async findBySubmission(submissionId: string): Promise<Evaluation[]> {
    await this.submissionService.findById(submissionId);
    return this.repository.findBySubmission(submissionId);
  }
}
