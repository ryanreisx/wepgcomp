import { Module } from '@nestjs/common';
import { GuidanceController } from './guidance.controller';
import { GuidanceService } from './guidance.service';
import { GuidanceRepository } from './guidance.repository';

@Module({
  controllers: [GuidanceController],
  providers: [GuidanceService, GuidanceRepository],
  exports: [GuidanceService],
})
export class GuidanceModule {}
