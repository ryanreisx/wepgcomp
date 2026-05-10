import { Injectable, NotFoundException } from '@nestjs/common';
import { Room } from '@prisma/client';
import { RoomRepository } from './room.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomService {
  constructor(
    private readonly repository: RoomRepository,
    private readonly eventEditionService: EventEditionService,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    await this.eventEditionService.findById(dto.eventEditionId);
    return this.repository.create(dto);
  }

  async findByEdition(eventEditionId: string): Promise<Room[]> {
    await this.eventEditionService.findById(eventEditionId);
    return this.repository.findByEdition(eventEditionId);
  }

  async remove(id: string): Promise<Room> {
    const room = await this.repository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return this.repository.delete(id);
  }
}
