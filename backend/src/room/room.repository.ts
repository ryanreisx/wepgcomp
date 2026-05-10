import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Room } from '@prisma/client';

@Injectable()
export class RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RoomUncheckedCreateInput): Promise<Room> {
    return this.prisma.room.create({ data });
  }

  async findByEdition(eventEditionId: string): Promise<Room[]> {
    return this.prisma.room.findMany({ where: { eventEditionId } });
  }

  async findById(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<Room> {
    return this.prisma.room.delete({ where: { id } });
  }
}
