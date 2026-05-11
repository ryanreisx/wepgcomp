import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EventEditionService } from '../event-edition/event-edition.service';
import { SubmissionService } from '../submission/submission.service';

const now = new Date();
const pastDate = new Date(now.getTime() - 86400000);
const futureDate = new Date(now.getTime() + 86400000);
const farFuture = new Date(now.getTime() + 172800000);

const mockSubmission = {
  id: 'submission-1',
  eventEditionId: 'edition-1',
  title: 'Test Submission',
};

const mockEditionOpen = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
  startDate: pastDate,
  endDate: futureDate,
  isEvaluationRestrictToLoggedUsers: false,
};

const mockEditionRestricted = {
  ...mockEditionOpen,
  isEvaluationRestrictToLoggedUsers: true,
};

const mockEditionNotStarted = {
  ...mockEditionOpen,
  startDate: futureDate,
  endDate: farFuture,
};

const mockEditionEnded = {
  ...mockEditionOpen,
  startDate: new Date(now.getTime() - 172800000),
  endDate: pastDate,
};

const mockCriteria = {
  id: 'criteria-1',
  eventEditionId: 'edition-1',
  title: 'Conteúdo',
};

const mockEvaluation = {
  id: 'eval-1',
  userId: 'user-1',
  evaluationCriteriaId: 'criteria-1',
  submissionId: 'submission-1',
  score: 4,
  comments: null,
  name: null,
  email: null,
  createdAt: now,
  updatedAt: now,
};

const mockRepository = {
  create: jest.fn(),
  findExisting: jest.fn(),
  update: jest.fn(),
  findBySubmission: jest.fn(),
};

const mockEvaluationCriteriaService = {
  findById: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

const mockSubmissionService = {
  findById: jest.fn(),
};

describe('EvaluationService', () => {
  let service: EvaluationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        { provide: EvaluationRepository, useValue: mockRepository },
        {
          provide: EvaluationCriteriaService,
          useValue: mockEvaluationCriteriaService,
        },
        { provide: EventEditionService, useValue: mockEventEditionService },
        { provide: SubmissionService, useValue: mockSubmissionService },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      evaluationCriteriaId: 'criteria-1',
      submissionId: 'submission-1',
      score: 4,
    };

    it('should create evaluation for a logged-in user', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionOpen);
      mockEvaluationCriteriaService.findById.mockResolvedValue(mockCriteria);
      mockRepository.findExisting.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockEvaluation);

      const result = await service.create(createDto, 'user-1');

      expect(result).toEqual(mockEvaluation);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user-1',
      });
    });

    it('should create evaluation for a non-logged user when restriction is off', async () => {
      const dtoWithName = { ...createDto, name: 'Anon', email: 'a@b.com' };
      const anonEval = {
        ...mockEvaluation,
        userId: null,
        name: 'Anon',
        email: 'a@b.com',
      };
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionOpen);
      mockEvaluationCriteriaService.findById.mockResolvedValue(mockCriteria);
      mockRepository.create.mockResolvedValue(anonEval);

      const result = await service.create(dtoWithName);

      expect(result.userId).toBeNull();
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dtoWithName,
        userId: null,
      });
    });

    it('should throw UnauthorizedException when restriction is on and user not logged in', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionRestricted);

      await expect(service.create(createDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should allow logged-in user when restriction is on', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionRestricted);
      mockEvaluationCriteriaService.findById.mockResolvedValue(mockCriteria);
      mockRepository.findExisting.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockEvaluation);

      const result = await service.create(createDto, 'user-1');

      expect(result).toEqual(mockEvaluation);
    });

    it('should upsert when logged user votes again on same submission+criteria', async () => {
      const updatedEval = { ...mockEvaluation, score: 5 };
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionOpen);
      mockEvaluationCriteriaService.findById.mockResolvedValue(mockCriteria);
      mockRepository.findExisting.mockResolvedValue(mockEvaluation);
      mockRepository.update.mockResolvedValue(updatedEval);

      const result = await service.create({ ...createDto, score: 5 }, 'user-1');

      expect(result.score).toBe(5);
      expect(mockRepository.update).toHaveBeenCalledWith('eval-1', {
        score: 5,
        comments: undefined,
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when voting before event starts', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionNotStarted);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when voting after event ends', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionEnded);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      mockSubmissionService.findById.mockRejectedValue(
        new NotFoundException('Submission not found'),
      );

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when criteria does not exist', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockEventEditionService.findById.mockResolvedValue(mockEditionOpen);
      mockEvaluationCriteriaService.findById.mockRejectedValue(
        new NotFoundException('Evaluation criteria not found'),
      );

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findBySubmission', () => {
    it('should return evaluations for a submission', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockRepository.findBySubmission.mockResolvedValue([mockEvaluation]);

      const result = await service.findBySubmission('submission-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.findBySubmission).toHaveBeenCalledWith(
        'submission-1',
      );
    });

    it('should return empty array when submission has no evaluations', async () => {
      mockSubmissionService.findById.mockResolvedValue(mockSubmission);
      mockRepository.findBySubmission.mockResolvedValue([]);

      const result = await service.findBySubmission('submission-1');

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      mockSubmissionService.findById.mockRejectedValue(
        new NotFoundException('Submission not found'),
      );

      await expect(service.findBySubmission('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
