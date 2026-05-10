import { Module } from '@nestjs/common';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { UserModule } from '../user/user.module';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { CommitteeRepository } from './committee.repository';

@Module({
  imports: [EventEditionModule, UserModule],
  controllers: [CommitteeController],
  providers: [CommitteeService, CommitteeRepository],
  exports: [CommitteeService],
})
export class CommitteeModule {}
