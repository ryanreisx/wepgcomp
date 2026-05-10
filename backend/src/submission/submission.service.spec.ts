import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserLevel } from '@prisma/client';
import { SubmissionService } from './submission.service';
import { SubmissionRepository } from './submission.repository';
import { EventEditionService } from '../event-edition/event-edition.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmission = {
  id: 'sub-1',
  advisorId: 'advisor-1',
  mainAuthorId: 'author-1',
  eventEditionId: 'edition-1',
  title: 'Test Submission',
  abstract: 'Test abstract content',
  pdfFile: 'submissions/sub-1/paper.pdf',
  phoneNumber: '71999999999',
  proposedPresentationBlockId: null,
  proposedPositionWithinBlock: null,
  coAdvisor: null,
  status: 'Submitted',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
  description: 'Workshop',
  callForPapersText: 'CFP',
  partnersText: 'Partners',
  location: 'Salvador',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-03'),
  submissionStartDate: new Date('2025-06-01'),
  submissionDeadline: new Date('2099-12-31'),
  isActive: true,
  isEvaluationRestrictToLoggedUsers: true,
  presentationDuration: 20,
  presentationsPerPresentationBlock: 6,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFile = {
  buffer: Buffer.from('fake pdf content'),
  fieldname: 'pdfFile',
  originalname: 'paper.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1024,
} as Express.Multer.File;

const mockRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByAuthor: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  userExists: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('./uploads'),
};

describe('SubmissionService', () => {
  let service: SubmissionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        { provide: SubmissionRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      advisorId: 'advisor-1',
      eventEditionId: 'edition-1',
      title: 'Test Submission',
      abstract: 'Test abstract content',
      phoneNumber: '71999999999',
    };

    it('should create a submission successfully', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(mockSubmission);

      const result = await service.create(createDto, 'author-1', mockFile);

      expect(result).toEqual(mockSubmission);
      expect(mockEventEditionService.findById).toHaveBeenCalledWith(
        'edition-1',
      );
      expect(mockRepository.userExists).toHaveBeenCalledWith('advisor-1');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          advisorId: 'advisor-1',
          mainAuthorId: 'author-1',
          eventEditionId: 'edition-1',
          title: 'Test Submission',
        }),
      );
    });

    it('should save file with correct relative path', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(mockSubmission);

      await service.create(createDto, 'author-1', mockFile);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pdfFile: expect.stringMatching(
            /^submissions\/.*\/paper\.pdf$/,
          ) as string,
        }),
      );
    });

    it('should throw BadRequestException when submission deadline has passed', async () => {
      const pastEdition = {
        ...mockEdition,
        submissionDeadline: new Date('2020-01-01'),
      };
      mockEventEditionService.findById.mockResolvedValue(pastEdition);

      await expect(
        service.create(createDto, 'author-1', mockFile),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when advisor does not exist', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.userExists.mockResolvedValue(false);

      await expect(
        service.create(createDto, 'author-1', mockFile),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all submissions', async () => {
      mockRepository.findAll.mockResolvedValue([mockSubmission]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should filter by eventEditionId', async () => {
      mockRepository.findAll.mockResolvedValue([mockSubmission]);

      const result = await service.findAll('edition-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith('edition-1');
    });
  });

  describe('findById', () => {
    it('should return submission when found', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);

      const result = await service.findById('sub-1');

      expect(result).toEqual(mockSubmission);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByAuthor', () => {
    it('should return submissions for the given author', async () => {
      mockRepository.findByAuthor.mockResolvedValue([mockSubmission]);

      const result = await service.findByAuthor('author-1');

      expect(result).toEqual([mockSubmission]);
      expect(mockRepository.findByAuthor).toHaveBeenCalledWith('author-1');
    });

    it('should return empty array when author has no submissions', async () => {
      mockRepository.findByAuthor.mockResolvedValue([]);

      const result = await service.findByAuthor('author-no-subs');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateDto = { title: 'Updated Title' };

    it('should allow the author to update their submission', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);
      const updated = { ...mockSubmission, title: 'Updated Title' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        'sub-1',
        updateDto,
        'author-1',
        UserLevel.Default,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should allow an Admin to update any submission', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);
      const updated = { ...mockSubmission, title: 'Updated Title' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        'sub-1',
        updateDto,
        'other-user',
        UserLevel.Admin,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should allow a Superadmin to update any submission', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);
      const updated = { ...mockSubmission, title: 'Updated Title' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        'sub-1',
        updateDto,
        'other-user',
        UserLevel.Superadmin,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException when non-author non-admin tries to update', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);

      await expect(
        service.update('sub-1', updateDto, 'other-user', UserLevel.Default),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when submission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto, 'author-1', UserLevel.Default),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when updated advisorId does not exist', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);
      mockRepository.userExists.mockResolvedValue(false);

      await expect(
        service.update(
          'sub-1',
          { advisorId: 'invalid-advisor' },
          'author-1',
          UserLevel.Default,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update pdfFile when a new file is uploaded', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);
      const updated = {
        ...mockSubmission,
        pdfFile: 'submissions/sub-1/paper.pdf',
      };
      mockRepository.update.mockResolvedValue(updated);

      await service.update(
        'sub-1',
        {},
        'author-1',
        UserLevel.Default,
        mockFile,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({
          pdfFile: 'submissions/sub-1/paper.pdf',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a submission', async () => {
      mockRepository.findById.mockResolvedValue(mockSubmission);
      mockRepository.delete.mockResolvedValue(mockSubmission);

      await expect(service.delete('sub-1')).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('sub-1');
    });

    it('should throw NotFoundException when submission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
