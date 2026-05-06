import { Module } from '@nestjs/common';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { CommitteeRepository } from './committee.repository';

@Module({
  controllers: [CommitteeController],
  providers: [CommitteeService, CommitteeRepository],
  exports: [CommitteeService],
})
export class CommitteeModule {}
