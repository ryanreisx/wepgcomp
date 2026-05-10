import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GuidanceService } from './guidance.service';
import { GuidanceRepository } from './guidance.repository';
import { EventEditionService } from '../event-edition/event-edition.service';

const mockGuidance = {
  id: 'guidance-1',
  eventEditionId: 'edition-1',
  summary: 'Resumo das orientações',
  authorGuidance: 'Orientações para autores',
  reviewerGuidance: 'Orientações para avaliadores',
  audienceGuidance: 'Orientações para audiência',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
};

const mockRepository = {
  create: jest.fn(),
  findByEdition: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

describe('GuidanceService', () => {
  let service: GuidanceService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuidanceService,
        { provide: GuidanceRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
      ],
    }).compile();

    service = module.get<GuidanceService>(GuidanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      eventEditionId: 'edition-1',
      summary: 'Resumo das orientações',
      authorGuidance: 'Orientações para autores',
      reviewerGuidance: 'Orientações para avaliadores',
      audienceGuidance: 'Orientações para audiência',
    };

    it('should create guidance when edition exists and no guidance exists yet', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockGuidance);

      const result = await service.create(createDto);

      expect(result).toEqual(mockGuidance);
      expect(mockEventEditionService.findById).toHaveBeenCalledWith(
        'edition-1',
      );
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when guidance already exists for edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue(mockGuidance);

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

    it('should create guidance with all optional fields null', async () => {
      const minimalDto = { eventEditionId: 'edition-1' };
      const minimalGuidance = {
        ...mockGuidance,
        summary: null,
        authorGuidance: null,
        reviewerGuidance: null,
        audienceGuidance: null,
      };
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(minimalGuidance);

      const result = await service.create(minimalDto);

      expect(result.summary).toBeNull();
      expect(result.authorGuidance).toBeNull();
    });
  });

  describe('findByEdition', () => {
    it('should return guidance for a given edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue(mockGuidance);

      const result = await service.findByEdition('edition-1');

      expect(result).toEqual(mockGuidance);
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });

    it('should throw NotFoundException when guidance not found for edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue(null);

      await expect(service.findByEdition('edition-1')).rejects.toThrow(
        NotFoundException,
      );
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

  describe('update', () => {
    it('should update and return updated guidance', async () => {
      mockRepository.findById.mockResolvedValue(mockGuidance);
      const updated = { ...mockGuidance, summary: 'Novo resumo' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('guidance-1', {
        summary: 'Novo resumo',
      });

      expect(result.summary).toBe('Novo resumo');
      expect(mockRepository.update).toHaveBeenCalledWith('guidance-1', {
        summary: 'Novo resumo',
      });
    });

    it('should throw NotFoundException when guidance not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { summary: 'Test' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
