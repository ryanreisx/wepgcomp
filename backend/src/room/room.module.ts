import { Module } from '@nestjs/common';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomRepository } from './room.repository';

@Module({
  imports: [EventEditionModule],
  controllers: [RoomController],
  providers: [RoomService, RoomRepository],
  exports: [RoomService],
})
export class RoomModule {}
