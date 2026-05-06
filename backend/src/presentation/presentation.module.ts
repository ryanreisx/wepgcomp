import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { PresentationRepository } from './presentation.repository';

@Module({
  controllers: [PresentationController],
  providers: [PresentationService, PresentationRepository],
  exports: [PresentationService],
})
export class PresentationModule {}
