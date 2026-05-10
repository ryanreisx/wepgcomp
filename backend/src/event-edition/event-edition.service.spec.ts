import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEditionService } from './event-edition.service';
import { EventEditionRepository } from './event-edition.repository';

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
  description: 'Workshop description',
  callForPapersText: 'Call for papers',
  partnersText: 'Partners info',
  location: 'Salvador, BA',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-03'),
  submissionStartDate: new Date('2025-06-01'),
  submissionDeadline: new Date('2025-09-01'),
  isActive: false,
  isEvaluationRestrictToLoggedUsers: true,
  presentationDuration: 20,
  presentationsPerPresentationBlock: 6,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findActive: jest.fn(),
  update: jest.fn(),
  clearSubmissionAssociations: jest.fn(),
  deletePresentationsByEdition: jest.fn(),
};

describe('EventEditionService', () => {
  let service: EventEditionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventEditionService,
        { provide: EventEditionRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<EventEditionService>(EventEditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'WEPGCOMP 2025',
      description: 'Workshop description',
      callForPapersText: 'Call for papers',
      partnersText: 'Partners info',
      location: 'Salvador, BA',
      startDate: '2025-12-01T00:00:00.000Z',
      endDate: '2025-12-03T00:00:00.000Z',
      submissionStartDate: '2025-06-01T00:00:00.000Z',
      submissionDeadline: '2025-09-01T00:00:00.000Z',
    };

    it('should create an event edition with isActive=false', async () => {
      mockRepository.create.mockResolvedValue(mockEdition);

      const result = await service.create(createDto);

      expect(result).toEqual(mockEdition);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should convert date strings to Date objects', async () => {
      mockRepository.create.mockResolvedValue(mockEdition);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date) as Date,
          endDate: expect.any(Date) as Date,
          submissionStartDate: expect.any(Date) as Date,
          submissionDeadline: expect.any(Date) as Date,
        }),
      );
    });

    it('should throw BadRequestException when submissionDeadline is after startDate', async () => {
      const invalidDto = {
        ...createDto,
        submissionDeadline: '2025-12-15T00:00:00.000Z',
        startDate: '2025-12-01T00:00:00.000Z',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should allow submissionDeadline equal to startDate', async () => {
      const validDto = {
        ...createDto,
        submissionDeadline: '2025-12-01T00:00:00.000Z',
        startDate: '2025-12-01T00:00:00.000Z',
      };
      mockRepository.create.mockResolvedValue(mockEdition);

      await expect(service.create(validDto)).resolves.toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return array of event editions', async () => {
      mockRepository.findAll.mockResolvedValue([mockEdition]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return event edition when found', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);

      const result = await service.findById('edition-1');

      expect(result).toEqual(mockEdition);
      expect(mockRepository.findById).toHaveBeenCalledWith('edition-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActive', () => {
    it('should return the active event edition', async () => {
      const activeEdition = { ...mockEdition, isActive: true };
      mockRepository.findActive.mockResolvedValue(activeEdition);

      const result = await service.findActive();

      expect(result.isActive).toBe(true);
      expect(mockRepository.findActive).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no active edition', async () => {
      mockRepository.findActive.mockResolvedValue(null);

      await expect(service.findActive()).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return updated event edition', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);
      const updated = { ...mockEdition, name: 'WEPGCOMP 2026' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('edition-1', {
        name: 'WEPGCOMP 2026',
      });

      expect(result.eventEdition.name).toBe('WEPGCOMP 2026');
      expect(result.presentationsUnscheduled).toBe(0);
    });

    it('should throw NotFoundException when edition not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updated submissionDeadline is after startDate', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);

      await expect(
        service.update('edition-1', {
          submissionDeadline: '2025-12-15T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate dates when only startDate is updated', async () => {
      const editionWithLateDeadline = {
        ...mockEdition,
        submissionDeadline: new Date('2025-11-15'),
      };
      mockRepository.findById.mockResolvedValue(editionWithLateDeadline);

      await expect(
        service.update('edition-1', {
          startDate: '2025-11-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should desassociate presentations when presentationDuration changes', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);
      mockRepository.clearSubmissionAssociations.mockResolvedValue(3);
      mockRepository.deletePresentationsByEdition.mockResolvedValue(2);
      const updated = { ...mockEdition, presentationDuration: 30 };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('edition-1', {
        presentationDuration: 30,
      });

      expect(result.presentationsUnscheduled).toBe(5);
      expect(mockRepository.clearSubmissionAssociations).toHaveBeenCalledWith(
        'edition-1',
      );
      expect(mockRepository.deletePresentationsByEdition).toHaveBeenCalledWith(
        'edition-1',
      );
    });

    it('should desassociate presentations when presentationsPerPresentationBlock changes', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);
      mockRepository.clearSubmissionAssociations.mockResolvedValue(1);
      mockRepository.deletePresentationsByEdition.mockResolvedValue(1);
      const updated = { ...mockEdition, presentationsPerPresentationBlock: 4 };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('edition-1', {
        presentationsPerPresentationBlock: 4,
      });

      expect(result.presentationsUnscheduled).toBe(2);
      expect(mockRepository.clearSubmissionAssociations).toHaveBeenCalledWith(
        'edition-1',
      );
      expect(mockRepository.deletePresentationsByEdition).toHaveBeenCalledWith(
        'edition-1',
      );
    });

    it('should NOT desassociate when presentationDuration is unchanged', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);
      mockRepository.update.mockResolvedValue(mockEdition);

      const result = await service.update('edition-1', {
        presentationDuration: 20,
      });

      expect(result.presentationsUnscheduled).toBe(0);
      expect(mockRepository.clearSubmissionAssociations).not.toHaveBeenCalled();
      expect(
        mockRepository.deletePresentationsByEdition,
      ).not.toHaveBeenCalled();
    });

    it('should allow activating an edition', async () => {
      mockRepository.findById.mockResolvedValue(mockEdition);
      const activated = { ...mockEdition, isActive: true };
      mockRepository.update.mockResolvedValue(activated);

      const result = await service.update('edition-1', { isActive: true });

      expect(result.eventEdition.isActive).toBe(true);
    });
  });
});
