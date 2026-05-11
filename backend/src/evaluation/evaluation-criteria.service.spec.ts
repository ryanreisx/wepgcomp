import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EvaluationCriteriaRepository } from './evaluation-criteria.repository';
import { EventEditionService } from '../event-edition/event-edition.service';

const mockCriteria = {
  id: 'criteria-1',
  eventEditionId: 'edition-1',
  title: 'Conteúdo',
  description: 'Avalia o conteúdo da apresentação',
  weightRadio: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCriteria2 = {
  ...mockCriteria,
  id: 'criteria-2',
  title: 'Qualidade e Clareza',
  description: 'Avalia a qualidade e clareza da apresentação',
};

const mockEdition = { id: 'edition-1', name: 'WEPGCOMP 2025' };

const mockRepository = {
  create: jest.fn(),
  findByEdition: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

describe('EvaluationCriteriaService', () => {
  let service: EvaluationCriteriaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationCriteriaService,
        { provide: EvaluationCriteriaRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
      ],
    }).compile();

    service = module.get<EvaluationCriteriaService>(EvaluationCriteriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      eventEditionId: 'edition-1',
      title: 'Conteúdo',
      description: 'Avalia o conteúdo da apresentação',
    };

    it('should create an evaluation criteria', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.create.mockResolvedValue(mockCriteria);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCriteria);
      expect(mockEventEditionService.findById).toHaveBeenCalledWith(
        'edition-1',
      );
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should create an evaluation criteria with weightRadio', async () => {
      const dtoWithWeight = { ...createDto, weightRadio: 2.0 };
      const criteriaWithWeight = { ...mockCriteria, weightRadio: 2.0 };
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.create.mockResolvedValue(criteriaWithWeight);

      const result = await service.create(dtoWithWeight);

      expect(result.weightRadio).toBe(2.0);
      expect(mockRepository.create).toHaveBeenCalledWith(dtoWithWeight);
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
  });

  describe('findByEdition', () => {
    it('should return criteria for a given edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue([
        mockCriteria,
        mockCriteria2,
      ]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(2);
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });

    it('should return empty array when edition has no criteria', async () => {
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

  describe('findById', () => {
    it('should return criteria when found', async () => {
      mockRepository.findById.mockResolvedValue(mockCriteria);

      const result = await service.findById('criteria-1');

      expect(result).toEqual(mockCriteria);
    });

    it('should throw NotFoundException when criteria not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { title: 'Conteúdo Atualizado' };

    it('should update an evaluation criteria', async () => {
      const updated = { ...mockCriteria, title: 'Conteúdo Atualizado' };
      mockRepository.findById.mockResolvedValue(mockCriteria);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('criteria-1', updateDto);

      expect(result.title).toBe('Conteúdo Atualizado');
      expect(mockRepository.update).toHaveBeenCalledWith(
        'criteria-1',
        updateDto,
      );
    });

    it('should validate new eventEditionId when updating', async () => {
      const updateWithEdition = { eventEditionId: 'edition-2' };
      mockRepository.findById.mockResolvedValue(mockCriteria);
      mockEventEditionService.findById.mockResolvedValue({ id: 'edition-2' });
      mockRepository.update.mockResolvedValue({
        ...mockCriteria,
        eventEditionId: 'edition-2',
      });

      await service.update('criteria-1', updateWithEdition);

      expect(mockEventEditionService.findById).toHaveBeenCalledWith(
        'edition-2',
      );
    });

    it('should throw NotFoundException when criteria not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when new eventEditionId does not exist', async () => {
      mockRepository.findById.mockResolvedValue(mockCriteria);
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(
        service.update('criteria-1', { eventEditionId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete criteria when found', async () => {
      mockRepository.findById.mockResolvedValue(mockCriteria);
      mockRepository.delete.mockResolvedValue(mockCriteria);

      const result = await service.remove('criteria-1');

      expect(result).toEqual(mockCriteria);
      expect(mockRepository.delete).toHaveBeenCalledWith('criteria-1');
    });

    it('should throw NotFoundException when criteria not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
