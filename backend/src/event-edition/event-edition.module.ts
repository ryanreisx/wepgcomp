import { Module } from '@nestjs/common';
import { EventEditionController } from './event-edition.controller';
import { EventEditionService } from './event-edition.service';
import { EventEditionRepository } from './event-edition.repository';

@Module({
  controllers: [EventEditionController],
  providers: [EventEditionService, EventEditionRepository],
  exports: [EventEditionService],
})
export class EventEditionModule {}
