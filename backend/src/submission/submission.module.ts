import { Module } from '@nestjs/common';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';

@Module({
  imports: [EventEditionModule],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionRepository],
  exports: [SubmissionService],
})
export class SubmissionModule {}
