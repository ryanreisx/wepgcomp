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
  findByEditionWithEvaluations: jest.fn(),
  updateScores: jest.fn(),
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

  describe('getRanking', () => {
    const makeEval = (id: string, userId: string | null, score: number) => ({
      id,
      userId,
      evaluationCriteriaId: 'criteria-1',
      submissionId: 'sub-1',
      score,
      comments: null,
      name: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const makePresWithEvals = (
      id: string,
      submissionId: string,
      title: string,
      authorName: string,
      evaluations: ReturnType<typeof makeEval>[],
      panelistUserIds: string[] = [],
    ) => ({
      id,
      submissionId,
      presentationBlockId: 'block-1',
      positionWithinBlock: 0,
      status: PresentationStatus.Scheduled,
      publicAverageScore: null,
      evaluatorsAverageScore: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      submission: {
        id: submissionId,
        title,
        mainAuthor: { name: authorName },
        evaluations,
        advisorId: 'advisor-1',
        mainAuthorId: 'author-1',
        eventEditionId: 'edition-1',
        pdfFile: 'test.pdf',
        phoneNumber: '71999999999',
        proposedPresentationBlockId: null,
        proposedPositionWithinBlock: null,
        coAdvisor: null,
        status: 'Submitted',
        abstract: 'Abstract',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      presentationBlock: {
        id: 'block-1',
        eventEditionId: 'edition-1',
        roomId: 'room-1',
        type: 'Presentation',
        title: 'Session 1',
        speakerName: null,
        startTime: new Date(),
        duration: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
        panelists: panelistUserIds.map((userId) => ({ userId })),
      },
    });

    it('should return ranking with 5 presentations sorted by nota_final desc (type=all)', async () => {
      const presentations = [
        makePresWithEvals('p1', 's1', 'Paper A', 'Author A', [
          makeEval('e1', 'u1', 4),
          makeEval('e2', 'u2', 2),
        ]),
        makePresWithEvals('p2', 's2', 'Paper B', 'Author B', [
          makeEval('e3', 'u1', 5),
          makeEval('e4', 'u2', 5),
          makeEval('e5', 'u3', 5),
        ]),
        makePresWithEvals('p3', 's3', 'Paper C', 'Author C', [
          makeEval('e6', 'u1', 1),
        ]),
        makePresWithEvals('p4', 's4', 'Paper D', 'Author D', [
          makeEval('e7', 'u1', 3),
          makeEval('e8', 'u2', 3),
          makeEval('e9', 'u3', 3),
          makeEval('e10', 'u4', 3),
        ]),
        makePresWithEvals('p5', 's5', 'Paper E', 'Author E', [
          makeEval('e11', 'u1', 4),
          makeEval('e12', 'u2', 4),
          makeEval('e13', 'u3', 4),
          makeEval('e14', 'u4', 4),
          makeEval('e15', 'u5', 4),
        ]),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      const result = await service.getRanking('edition-1', 'all');

      expect(result).toHaveLength(5);
      // Paper E: avg=4, count=5, nota=(4+5)/2=4.5
      expect(result[0].title).toBe('Paper E');
      expect(result[0].averageScore).toBe(4.5);
      // Paper B: avg=5, count=3, nota=(5+3)/2=4
      expect(result[1].title).toBe('Paper B');
      expect(result[1].averageScore).toBe(4);
      // Paper D: avg=3, count=4, nota=(3+4)/2=3.5
      expect(result[2].title).toBe('Paper D');
      expect(result[2].averageScore).toBe(3.5);
      // Paper A: avg=3, count=2, nota=(3+2)/2=2.5
      expect(result[3].title).toBe('Paper A');
      expect(result[3].averageScore).toBe(2.5);
      // Paper C: avg=1, count=1, nota=(1+1)/2=1
      expect(result[4].title).toBe('Paper C');
      expect(result[4].averageScore).toBe(1);
    });

    it('should handle tie in nota_final', async () => {
      const presentations = [
        makePresWithEvals('p1', 's1', 'Paper A', 'Author A', [
          makeEval('e1', 'u1', 4),
          makeEval('e2', 'u2', 4),
        ]),
        makePresWithEvals('p2', 's2', 'Paper B', 'Author B', [
          makeEval('e3', 'u1', 4),
          makeEval('e4', 'u2', 4),
        ]),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      const result = await service.getRanking('edition-1', 'all');

      expect(result).toHaveLength(2);
      // Both: avg=4, count=2, nota=(4+2)/2=3
      expect(result[0].averageScore).toBe(3);
      expect(result[1].averageScore).toBe(3);
    });

    it('should return empty list when edition has no evaluations', async () => {
      const presentations = [
        makePresWithEvals('p1', 's1', 'Paper A', 'Author A', []),
        makePresWithEvals('p2', 's2', 'Paper B', 'Author B', []),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      const result = await service.getRanking('edition-1', 'all');

      expect(result).toHaveLength(2);
      expect(result[0].averageScore).toBe(0);
      expect(result[1].averageScore).toBe(0);
    });

    it('should return empty list when no presentations exist', async () => {
      mockRepository.findByEditionWithEvaluations.mockResolvedValue([]);

      const result = await service.getRanking('edition-1', 'all');

      expect(result).toHaveLength(0);
    });

    it('should filter to public evaluations only (type=public)', async () => {
      const presentations = [
        makePresWithEvals(
          'p1',
          's1',
          'Paper A',
          'Author A',
          [
            makeEval('e1', 'panelist-1', 5),
            makeEval('e2', 'public-1', 2),
            makeEval('e3', 'public-2', 2),
          ],
          ['panelist-1'],
        ),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      const result = await service.getRanking('edition-1', 'public');

      // Public only: scores [2, 2], avg=2, count=2, nota=(2+2)/2=2
      expect(result[0].averageScore).toBe(2);
    });

    it('should filter to panelist evaluations only (type=panelists)', async () => {
      const presentations = [
        makePresWithEvals(
          'p1',
          's1',
          'Paper A',
          'Author A',
          [
            makeEval('e1', 'panelist-1', 5),
            makeEval('e2', 'panelist-2', 5),
            makeEval('e3', 'public-1', 1),
          ],
          ['panelist-1', 'panelist-2'],
        ),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      const result = await service.getRanking('edition-1', 'panelists');

      // Panelists only: scores [5, 5], avg=5, count=2, nota=(5+2)/2=3.5
      expect(result[0].averageScore).toBe(3.5);
    });

    it('should include anonymous evaluations in public ranking', async () => {
      const presentations = [
        makePresWithEvals(
          'p1',
          's1',
          'Paper A',
          'Author A',
          [makeEval('e1', null, 3), makeEval('e2', 'public-1', 3)],
          ['panelist-1'],
        ),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      const result = await service.getRanking('edition-1', 'public');

      // Anonymous (null userId) should be included in public: scores [3, 3]
      // avg=3, count=2, nota=(3+2)/2=2.5
      expect(result[0].averageScore).toBe(2.5);
    });

    it('should update publicAverageScore and evaluatorsAverageScore', async () => {
      const presentations = [
        makePresWithEvals(
          'p1',
          's1',
          'Paper A',
          'Author A',
          [makeEval('e1', 'panelist-1', 5), makeEval('e2', 'public-1', 3)],
          ['panelist-1'],
        ),
      ];

      mockRepository.findByEditionWithEvaluations.mockResolvedValue(
        presentations,
      );
      mockRepository.updateScores.mockResolvedValue({});

      await service.getRanking('edition-1', 'all');

      // Public: score [3], avg=3, count=1, nota=(3+1)/2=2
      // Panelists: score [5], avg=5, count=1, nota=(5+1)/2=3
      expect(mockRepository.updateScores).toHaveBeenCalledWith('p1', 2, 3);
    });
  });
});
