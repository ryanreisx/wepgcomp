import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AwardedPanelistService } from './awarded-panelist.service';
import { AwardedPanelistRepository } from './awarded-panelist.repository';
import { EventEditionService } from '../event-edition/event-edition.service';

const now = new Date();

const mockAwarded = {
  eventEditionId: 'edition-1',
  userId: 'user-1',
  createdAt: now,
  updatedAt: now,
};

const mockEdition = { id: 'edition-1', name: 'WEPGCOMP 2025' };

const mockRepository = {
  create: jest.fn(),
  findByEdition: jest.fn(),
  findByEditionAndUser: jest.fn(),
  countByEdition: jest.fn(),
  delete: jest.fn(),
  userExists: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

describe('AwardedPanelistService', () => {
  let service: AwardedPanelistService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwardedPanelistService,
        { provide: AwardedPanelistRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
      ],
    }).compile();

    service = module.get<AwardedPanelistService>(AwardedPanelistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = { eventEditionId: 'edition-1', userId: 'user-1' };

    it('should award a panelist', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);
      mockRepository.countByEdition.mockResolvedValue(0);
      mockRepository.create.mockResolvedValue(mockAwarded);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAwarded);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should allow up to 3 awarded panelists', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);
      mockRepository.countByEdition.mockResolvedValue(2);
      mockRepository.create.mockResolvedValue(mockAwarded);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAwarded);
    });

    it('should throw BadRequestException when trying to add a 4th awarded panelist', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByEditionAndUser.mockResolvedValue(null);
      mockRepository.countByEdition.mockResolvedValue(3);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already awarded', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByEditionAndUser.mockResolvedValue(mockAwarded);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when edition does not exist', async () => {
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEdition', () => {
    it('should return awarded panelists for a given edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      const list = [
        mockAwarded,
        { ...mockAwarded, userId: 'user-2' },
        { ...mockAwarded, userId: 'user-3' },
      ];
      mockRepository.findByEdition.mockResolvedValue(list);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(3);
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });

    it('should return empty array when no awarded panelists', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue([]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(0);
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
    it('should remove an awarded panelist', async () => {
      mockRepository.findByEditionAndUser.mockResolvedValue(mockAwarded);
      mockRepository.delete.mockResolvedValue(mockAwarded);

      const result = await service.remove('edition-1', 'user-1');

      expect(result).toEqual(mockAwarded);
      expect(mockRepository.delete).toHaveBeenCalledWith('edition-1', 'user-1');
    });

    it('should throw NotFoundException when awarded panelist not found', async () => {
      mockRepository.findByEditionAndUser.mockResolvedValue(null);

      await expect(service.remove('edition-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
