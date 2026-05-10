import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommitteeService } from './committee.service';
import { CommitteeRepository } from './committee.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { UserService } from '../user/user.service';
import {
  CommitteeLevel,
  CommitteeRole,
  Profile,
  UserLevel,
} from '@prisma/client';

const mockMember = {
  id: 'member-1',
  eventEditionId: 'edition-1',
  userId: 'user-1',
  level: CommitteeLevel.Committee,
  role: CommitteeRole.Organizer,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCoordinator = {
  ...mockMember,
  id: 'member-2',
  userId: 'user-2',
  level: CommitteeLevel.Coordinator,
  role: CommitteeRole.Organizer,
};

const mockEdition = { id: 'edition-1', name: 'WEPGCOMP 2025' };

const mockUser = {
  id: 'user-1',
  name: 'Professor A',
  profile: Profile.Professor,
  level: UserLevel.Default,
};

const mockRepository = {
  create: jest.fn(),
  findByEdition: jest.fn(),
  findById: jest.fn(),
  findByEditionAndUser: jest.fn(),
  findCoordinator: jest.fn(),
  delete: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

const mockUserService = {
  findById: jest.fn(),
  updateLevel: jest.fn(),
};

describe('CommitteeService', () => {
  let service: CommitteeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitteeService,
        { provide: CommitteeRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<CommitteeService>(CommitteeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      eventEditionId: 'edition-1',
      userId: 'user-1',
      level: CommitteeLevel.Committee,
      role: CommitteeRole.Organizer,
    };

    it('should create a committee member', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockMember);

      const result = await service.create(createDto, UserLevel.Admin);

      expect(result).toEqual(mockMember);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when member already exists for edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockRepository.findByEditionAndUser.mockResolvedValue(mockMember);

      await expect(service.create(createDto, UserLevel.Admin)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when edition does not exist', async () => {
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(service.create(createDto, UserLevel.Admin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockUserService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.create(createDto, UserLevel.Admin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create coordinator', () => {
    const coordinatorDto = {
      eventEditionId: 'edition-1',
      userId: 'user-1',
      level: CommitteeLevel.Coordinator,
      role: CommitteeRole.Organizer,
    };

    it('should assign coordinator and auto-promote to Superadmin', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);
      mockRepository.findCoordinator.mockResolvedValue(null);
      mockUserService.updateLevel.mockResolvedValue({
        ...mockUser,
        level: UserLevel.Superadmin,
      });
      mockRepository.create.mockResolvedValue({
        ...mockMember,
        level: CommitteeLevel.Coordinator,
      });

      const result = await service.create(coordinatorDto, UserLevel.Superadmin);

      expect(result.level).toBe(CommitteeLevel.Coordinator);
      expect(mockUserService.updateLevel).toHaveBeenCalledWith(
        'user-1',
        UserLevel.Superadmin,
        UserLevel.Superadmin,
      );
    });

    it('should replace existing coordinator when assigning new one', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);
      mockRepository.findCoordinator.mockResolvedValue(mockCoordinator);
      mockRepository.delete.mockResolvedValue(mockCoordinator);
      mockUserService.updateLevel.mockResolvedValue({
        ...mockUser,
        level: UserLevel.Superadmin,
      });
      mockRepository.create.mockResolvedValue({
        ...mockMember,
        level: CommitteeLevel.Coordinator,
      });

      await service.create(coordinatorDto, UserLevel.Superadmin);

      expect(mockRepository.delete).toHaveBeenCalledWith('member-2');
      expect(mockUserService.updateLevel).toHaveBeenCalledWith(
        'user-1',
        UserLevel.Superadmin,
        UserLevel.Superadmin,
      );
    });

    it('should throw ForbiddenException when non-Superadmin assigns coordinator', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);

      await expect(
        service.create(coordinatorDto, UserLevel.Admin),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockUserService.updateLevel).not.toHaveBeenCalled();
    });
  });

  describe('findByEdition', () => {
    it('should return members for a given edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue([mockMember]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });

    it('should throw NotFoundException when edition does not exist', async () => {
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(service.findByEdition('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete member when found', async () => {
      mockRepository.findById.mockResolvedValue(mockMember);
      mockRepository.delete.mockResolvedValue(mockMember);

      const result = await service.remove('member-1');

      expect(result).toEqual(mockMember);
      expect(mockRepository.delete).toHaveBeenCalledWith('member-1');
    });

    it('should throw NotFoundException when member not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
