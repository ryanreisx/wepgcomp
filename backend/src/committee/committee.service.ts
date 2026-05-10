import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommitteeMember,
  CommitteeLevel,
  CommitteeRole,
  UserLevel,
} from '@prisma/client';
import { CommitteeRepository } from './committee.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { UserService } from '../user/user.service';
import { CreateCommitteeMemberDto } from './dto/create-committee-member.dto';

@Injectable()
export class CommitteeService {
  constructor(
    private readonly repository: CommitteeRepository,
    private readonly eventEditionService: EventEditionService,
    private readonly userService: UserService,
  ) {}

  async create(
    dto: CreateCommitteeMemberDto,
    callerLevel: UserLevel,
  ): Promise<CommitteeMember> {
    await this.eventEditionService.findById(dto.eventEditionId);
    await this.userService.findById(dto.userId);

    const existing = await this.repository.findByEditionAndUser(
      dto.eventEditionId,
      dto.userId,
    );
    if (existing) {
      throw new ConflictException(
        'User is already a committee member for this edition',
      );
    }

    const isCoordinator =
      dto.level === CommitteeLevel.Coordinator &&
      dto.role === CommitteeRole.Organizer;

    if (isCoordinator) {
      if (callerLevel !== UserLevel.Superadmin) {
        throw new ForbiddenException(
          'Only Superadmin can assign a coordinator',
        );
      }

      const currentCoordinator = await this.repository.findCoordinator(
        dto.eventEditionId,
      );
      if (currentCoordinator) {
        await this.repository.delete(currentCoordinator.id);
      }

      await this.userService.updateLevel(
        dto.userId,
        UserLevel.Superadmin,
        UserLevel.Superadmin,
      );
    }

    return this.repository.create(dto);
  }

  async findByEdition(eventEditionId: string): Promise<CommitteeMember[]> {
    await this.eventEditionService.findById(eventEditionId);
    return this.repository.findByEdition(eventEditionId);
  }

  async remove(id: string): Promise<CommitteeMember> {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new NotFoundException('Committee member not found');
    }
    return this.repository.delete(id);
  }
}
