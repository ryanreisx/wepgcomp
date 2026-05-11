import { Module } from '@nestjs/common';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { PresentationRepository } from './presentation.repository';
import { PresentationBlockController } from './presentation-block.controller';
import { PresentationBlockService } from './presentation-block.service';
import { PresentationBlockRepository } from './presentation-block.repository';
import { PanelistController } from './panelist.controller';
import { PanelistService } from './panelist.service';
import { PanelistRepository } from './panelist.repository';

@Module({
  imports: [EventEditionModule],
  controllers: [
    PresentationController,
    PresentationBlockController,
    PanelistController,
  ],
  providers: [
    PresentationService,
    PresentationRepository,
    PresentationBlockService,
    PresentationBlockRepository,
    PanelistService,
    PanelistRepository,
  ],
  exports: [PresentationService, PresentationBlockService],
})
export class PresentationModule {}
