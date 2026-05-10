import { Module } from '@nestjs/common';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { GuidanceController } from './guidance.controller';
import { GuidanceService } from './guidance.service';
import { GuidanceRepository } from './guidance.repository';

@Module({
  imports: [EventEditionModule],
  controllers: [GuidanceController],
  providers: [GuidanceService, GuidanceRepository],
  exports: [GuidanceService],
})
export class GuidanceModule {}
