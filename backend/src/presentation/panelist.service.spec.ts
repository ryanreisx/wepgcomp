import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PanelistStatus } from '@prisma/client';
import { PanelistService } from './panelist.service';
import { PanelistRepository } from './panelist.repository';
import { PresentationBlockService } from './presentation-block.service';

const mockPanelist = {
  id: 'panelist-1',
  presentationBlockId: 'block-1',
  userId: 'user-1',
  status: PanelistStatus.Confirmed,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBlock = {
  id: 'block-1',
  eventEditionId: 'edition-1',
  roomId: 'room-1',
  type: 'Presentation',
  title: 'Session 1',
  speakerName: null,
  startTime: new Date('2025-12-01T10:00:00.000Z'),
  duration: 60,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  findByBlock: jest.fn(),
  findById: jest.fn(),
  findByBlockAndUser: jest.fn(),
  delete: jest.fn(),
  userExists: jest.fn(),
};

const mockPresentationBlockService = {
  findById: jest.fn(),
};

describe('PanelistService', () => {
  let service: PanelistService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PanelistService,
        { provide: PanelistRepository, useValue: mockRepository },
        {
          provide: PresentationBlockService,
          useValue: mockPresentationBlockService,
        },
      ],
    }).compile();

    service = module.get<PanelistService>(PanelistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      presentationBlockId: 'block-1',
      userId: 'user-1',
    };

    it('should assign a panelist to a block', async () => {
      mockPresentationBlockService.findById.mockResolvedValue(mockBlock);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByBlockAndUser.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockPanelist);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPanelist);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw NotFoundException when block does not exist', async () => {
      mockPresentationBlockService.findById.mockRejectedValue(
        new NotFoundException('Presentation block not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPresentationBlockService.findById.mockResolvedValue(mockBlock);
      mockRepository.userExists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already assigned to the block', async () => {
      mockPresentationBlockService.findById.mockResolvedValue(mockBlock);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByBlockAndUser.mockResolvedValue(mockPanelist);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should allow assigning same user to different blocks', async () => {
      mockPresentationBlockService.findById.mockResolvedValue(mockBlock);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.findByBlockAndUser.mockResolvedValue(null);
      const newPanelist = {
        ...mockPanelist,
        id: 'panelist-2',
        presentationBlockId: 'block-2',
      };
      mockRepository.create.mockResolvedValue(newPanelist);

      const dto = { ...createDto, presentationBlockId: 'block-2' };
      const result = await service.create(dto);

      expect(result.presentationBlockId).toBe('block-2');
    });
  });

  describe('findByBlock', () => {
    it('should return panelists for the given block', async () => {
      mockRepository.findByBlock.mockResolvedValue([mockPanelist]);

      const result = await service.findByBlock('block-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.findByBlock).toHaveBeenCalledWith('block-1');
    });

    it('should return empty array when no panelists', async () => {
      mockRepository.findByBlock.mockResolvedValue([]);

      const result = await service.findByBlock('block-1');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a panelist', async () => {
      mockRepository.findById.mockResolvedValue(mockPanelist);
      mockRepository.delete.mockResolvedValue(mockPanelist);

      await expect(service.delete('panelist-1')).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('panelist-1');
    });

    it('should throw NotFoundException when panelist not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
