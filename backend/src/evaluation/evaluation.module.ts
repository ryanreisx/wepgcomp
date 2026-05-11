import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationCriteriaController } from './evaluation-criteria.controller';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EvaluationCriteriaRepository } from './evaluation-criteria.repository';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { SubmissionModule } from '../submission/submission.module';

@Module({
  imports: [EventEditionModule, SubmissionModule],
  controllers: [EvaluationController, EvaluationCriteriaController],
  providers: [
    EvaluationService,
    EvaluationRepository,
    EvaluationCriteriaService,
    EvaluationCriteriaRepository,
  ],
  exports: [EvaluationService, EvaluationCriteriaService],
})
export class EvaluationModule {}
