import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PresentationStatus } from '@prisma/client';
import { PresentationService } from './presentation.service';
import { PresentationRepository } from './presentation.repository';
import { PresentationBlockService } from './presentation-block.service';

const mockPresentation = {
  id: 'pres-1',
  submissionId: 'sub-1',
  presentationBlockId: 'block-1',
  positionWithinBlock: 0,
  status: PresentationStatus.Scheduled,
  publicAverageScore: null,
  evaluatorsAverageScore: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPresentationWithSubmission = {
  ...mockPresentation,
  submission: {
    id: 'sub-1',
    title: 'Test Submission',
    abstract: 'Abstract',
    advisorId: 'advisor-1',
    mainAuthorId: 'author-1',
    eventEditionId: 'edition-1',
    pdfFile: 'submissions/sub-1/paper.pdf',
    phoneNumber: '71999999999',
    proposedPresentationBlockId: null,
    proposedPositionWithinBlock: null,
    coAdvisor: null,
    status: 'Submitted',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
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
  findByEdition: jest.fn(),
  findById: jest.fn(),
  findBySubmission: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  submissionExists: jest.fn(),
};

const mockPresentationBlockService = {
  findById: jest.fn(),
};

describe('PresentationService', () => {
  let service: PresentationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresentationService,
        { provide: PresentationRepository, useValue: mockRepository },
        {
          provide: PresentationBlockService,
          useValue: mockPresentationBlockService,
        },
      ],
    }).compile();

    service = module.get<PresentationService>(PresentationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      submissionId: 'sub-1',
      presentationBlockId: 'block-1',
      positionWithinBlock: 0,
    };

    it('should allocate a submission to a block', async () => {
      mockRepository.submissionExists.mockResolvedValue(true);
      mockPresentationBlockService.findById.mockResolvedValue(mockBlock);
      mockRepository.findBySubmission.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockPresentation);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPresentation);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should remove previous allocation when submission is already allocated (CA-5.1.8)', async () => {
      const previousAllocation = {
        ...mockPresentation,
        id: 'pres-old',
        presentationBlockId: 'block-old',
      };
      mockRepository.submissionExists.mockResolvedValue(true);
      mockPresentationBlockService.findById.mockResolvedValue(mockBlock);
      mockRepository.findBySubmission.mockResolvedValue(previousAllocation);
      mockRepository.delete.mockResolvedValue(previousAllocation);
      mockRepository.create.mockResolvedValue(mockPresentation);

      const result = await service.create(createDto);

      expect(mockRepository.delete).toHaveBeenCalledWith('pres-old');
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockPresentation);
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      mockRepository.submissionExists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when presentation block does not exist', async () => {
      mockRepository.submissionExists.mockResolvedValue(true);
      mockPresentationBlockService.findById.mockRejectedValue(
        new NotFoundException('Presentation block not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEdition', () => {
    it('should return presentations with submission data', async () => {
      mockRepository.findByEdition.mockResolvedValue([
        mockPresentationWithSubmission,
      ]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(1);
      expect(result[0].submission).toBeDefined();
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });

    it('should return empty array when no presentations', async () => {
      mockRepository.findByEdition.mockResolvedValue([]);

      const result = await service.findByEdition('edition-1');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return presentation when found', async () => {
      mockRepository.findById.mockResolvedValue(mockPresentation);

      const result = await service.findById('pres-1');

      expect(result).toEqual(mockPresentation);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update presentation block assignment', async () => {
      mockRepository.findById.mockResolvedValue(mockPresentation);
      const newBlock = { ...mockBlock, id: 'block-2' };
      mockPresentationBlockService.findById.mockResolvedValue(newBlock);
      const updated = { ...mockPresentation, presentationBlockId: 'block-2' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('pres-1', {
        presentationBlockId: 'block-2',
      });

      expect(result.presentationBlockId).toBe('block-2');
      expect(mockPresentationBlockService.findById).toHaveBeenCalledWith(
        'block-2',
      );
    });

    it('should update position within block', async () => {
      mockRepository.findById.mockResolvedValue(mockPresentation);
      const updated = { ...mockPresentation, positionWithinBlock: 3 };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('pres-1', {
        positionWithinBlock: 3,
      });

      expect(result.positionWithinBlock).toBe(3);
    });

    it('should throw NotFoundException when presentation not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { positionWithinBlock: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new block does not exist', async () => {
      mockRepository.findById.mockResolvedValue(mockPresentation);
      mockPresentationBlockService.findById.mockRejectedValue(
        new NotFoundException('Presentation block not found'),
      );

      await expect(
        service.update('pres-1', { presentationBlockId: 'invalid-block' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a presentation allocation', async () => {
      mockRepository.findById.mockResolvedValue(mockPresentation);
      mockRepository.delete.mockResolvedValue(mockPresentation);

      await expect(service.delete('pres-1')).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('pres-1');
    });

    it('should throw NotFoundException when presentation not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
