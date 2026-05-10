import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PresentationBlockType } from '@prisma/client';
import { PresentationBlockService } from './presentation-block.service';
import { PresentationBlockRepository } from './presentation-block.repository';
import { EventEditionService } from '../event-edition/event-edition.service';

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
  description: 'Workshop',
  callForPapersText: 'CFP',
  partnersText: 'Partners',
  location: 'Salvador',
  startDate: new Date('2025-12-01T08:00:00.000Z'),
  endDate: new Date('2025-12-03T22:00:00.000Z'),
  submissionStartDate: new Date('2025-06-01'),
  submissionDeadline: new Date('2025-09-01'),
  isActive: true,
  isEvaluationRestrictToLoggedUsers: true,
  presentationDuration: 20,
  presentationsPerPresentationBlock: 6,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBlock = {
  id: 'block-1',
  eventEditionId: 'edition-1',
  roomId: 'room-1',
  type: PresentationBlockType.Presentation,
  title: 'Session 1',
  speakerName: null,
  startTime: new Date('2025-12-01T10:00:00.000Z'),
  duration: 60,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  findByEdition: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findBlocksByEdition: jest.fn(),
  deletePresentationsByBlock: jest.fn(),
  clearProposedBlock: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

describe('PresentationBlockService', () => {
  let service: PresentationBlockService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresentationBlockService,
        {
          provide: PresentationBlockRepository,
          useValue: mockRepository,
        },
        {
          provide: EventEditionService,
          useValue: mockEventEditionService,
        },
      ],
    }).compile();

    service = module.get<PresentationBlockService>(PresentationBlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      eventEditionId: 'edition-1',
      roomId: 'room-1',
      type: PresentationBlockType.Presentation,
      title: 'Session 1',
      startTime: '2025-12-01T10:00:00.000Z',
      duration: 60,
    };

    it('should create a presentation block successfully', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(mockBlock);

      const result = await service.create(createDto);

      expect(result).toEqual(mockBlock);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventEditionId: 'edition-1',
          roomId: 'room-1',
          type: PresentationBlockType.Presentation,
          duration: 60,
        }),
      );
    });

    it('should throw BadRequestException when time is outside event period', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);

      const dto = {
        ...createDto,
        startTime: '2025-11-30T08:00:00.000Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when block end time exceeds event end', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);

      const dto = {
        ...createDto,
        startTime: '2025-12-03T21:30:00.000Z',
        duration: 60,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when Presentation type duration is not a multiple of presentationDuration', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([]);

      const dto = {
        ...createDto,
        duration: 35,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should allow non-Presentation type with any duration', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([]);
      const keynoteBlock = {
        ...mockBlock,
        type: PresentationBlockType.Keynote,
        duration: 35,
      };
      mockRepository.create.mockResolvedValue(keynoteBlock);

      const dto = {
        ...createDto,
        type: PresentationBlockType.Keynote,
        duration: 35,
      };

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should throw ConflictException when overlapping in the same room', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([mockBlock]);

      const dto = {
        ...createDto,
        startTime: '2025-12-01T10:30:00.000Z',
        duration: 60,
        roomId: 'room-1',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should allow overlapping blocks in different rooms', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([mockBlock]);
      const newBlock = { ...mockBlock, id: 'block-2', roomId: 'room-2' };
      mockRepository.create.mockResolvedValue(newBlock);

      const dto = {
        ...createDto,
        startTime: '2025-12-01T10:30:00.000Z',
        duration: 60,
        roomId: 'room-2',
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
    });

    it('should block all rooms when a session has no room (roomId = null)', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      const blockWithoutRoom = { ...mockBlock, roomId: null };
      mockRepository.findBlocksByEdition.mockResolvedValue([blockWithoutRoom]);

      const dto = {
        ...createDto,
        startTime: '2025-12-01T10:30:00.000Z',
        roomId: 'room-2',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should block all rooms when creating a session without room (roomId = null)', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([mockBlock]);

      const dto = {
        ...createDto,
        startTime: '2025-12-01T10:30:00.000Z',
        roomId: undefined,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should allow non-overlapping blocks in the same room', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([mockBlock]);
      const newBlock = {
        ...mockBlock,
        id: 'block-2',
        startTime: new Date('2025-12-01T11:00:00.000Z'),
      };
      mockRepository.create.mockResolvedValue(newBlock);

      const dto = {
        ...createDto,
        startTime: '2025-12-01T11:00:00.000Z',
        roomId: 'room-1',
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
    });
  });

  describe('findByEdition', () => {
    it('should return blocks for the given edition', async () => {
      mockRepository.findByEdition.mockResolvedValue([mockBlock]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });
  });

  describe('findById', () => {
    it('should return block when found', async () => {
      mockRepository.findById.mockResolvedValue(mockBlock);

      const result = await service.findById('block-1');

      expect(result).toEqual(mockBlock);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a presentation block', async () => {
      mockRepository.findById.mockResolvedValue(mockBlock);
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([]);
      const updated = { ...mockBlock, title: 'Updated Session' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('block-1', {
        title: 'Updated Session',
      });

      expect(result.title).toBe('Updated Session');
    });

    it('should throw NotFoundException when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate overlap on update excluding self', async () => {
      mockRepository.findById.mockResolvedValue(mockBlock);
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([]);
      mockRepository.update.mockResolvedValue(mockBlock);

      await service.update('block-1', {
        startTime: '2025-12-01T10:00:00.000Z',
      });

      expect(mockRepository.findBlocksByEdition).toHaveBeenCalledWith(
        'edition-1',
        'block-1',
      );
    });

    it('should throw ConflictException when update causes overlap', async () => {
      const otherBlock = {
        ...mockBlock,
        id: 'block-2',
        startTime: new Date('2025-12-01T12:00:00.000Z'),
      };
      mockRepository.findById.mockResolvedValue(mockBlock);
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findBlocksByEdition.mockResolvedValue([otherBlock]);

      await expect(
        service.update('block-1', {
          startTime: '2025-12-01T12:30:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a block and disassociate presentations', async () => {
      mockRepository.findById.mockResolvedValue(mockBlock);
      mockRepository.deletePresentationsByBlock.mockResolvedValue(3);
      mockRepository.clearProposedBlock.mockResolvedValue(1);
      mockRepository.delete.mockResolvedValue(mockBlock);

      await service.delete('block-1');

      expect(mockRepository.deletePresentationsByBlock).toHaveBeenCalledWith(
        'block-1',
      );
      expect(mockRepository.clearProposedBlock).toHaveBeenCalledWith('block-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('block-1');
    });

    it('should throw NotFoundException when block not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
