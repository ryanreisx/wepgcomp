import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CertificateService } from './certificate.service';
import { CertificateRepository } from './certificate.repository';
import { CertificateGenerator } from './certificate-generator';
import { EventEditionService } from '../event-edition/event-edition.service';
import { MessagingService } from '../messaging/messaging.service';

const now = new Date();

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
  startDate: new Date('2025-06-01'),
  endDate: new Date('2025-06-03'),
};

const mockPresenter = {
  id: 'user-presenter',
  name: 'Alice Silva',
  email: 'alice@ufba.br',
  profile: 'DoctoralStudent',
};

const mockProfessor = {
  id: 'user-professor',
  name: 'Prof. Carlos',
  email: 'carlos@ufba.br',
  profile: 'Professor',
};

const mockSubmission = {
  id: 'sub-1',
  title: 'A Study on AI',
  mainAuthorId: 'user-presenter',
  mainAuthor: mockPresenter,
};

const mockPresentation = {
  id: 'pres-1',
  submissionId: 'sub-1',
  publicAverageScore: 4.5,
  evaluatorsAverageScore: 4.2,
  submission: mockSubmission,
  presentationBlock: {
    id: 'block-1',
    panelists: [{ userId: 'user-professor' }],
  },
};

const mockCertificate = {
  id: 'cert-1',
  eventEditionId: 'edition-1',
  userId: 'user-presenter',
  filePath: 'uploads/certificates/edition-1/user-presenter.pdf',
  isEmailSent: false,
  createdAt: now,
  updatedAt: now,
};

const mockCertificateWithUser = {
  ...mockCertificate,
  user: mockPresenter,
  eventEdition: mockEdition,
};

const mockRepository = {
  create: jest.fn(),
  findByUser: jest.fn(),
  findById: jest.fn(),
  findByEditionAndUser: jest.fn(),
  deleteByEdition: jest.fn(),
  getParticipants: jest.fn(),
  getAwardedPanelists: jest.fn(),
  getPresentationsWithScores: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

const mockCertificateGenerator = {
  generate: jest.fn(),
};

const mockMessagingService = {
  publish: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('uploads'),
};

describe('CertificateService', () => {
  let service: CertificateService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateService,
        { provide: CertificateRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
        { provide: CertificateGenerator, useValue: mockCertificateGenerator },
        { provide: MessagingService, useValue: mockMessagingService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CertificateService>(CertificateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAll', () => {
    it('should generate certificates for a presenter', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.deleteByEdition.mockResolvedValue({ count: 0 });
      mockRepository.getParticipants.mockResolvedValue([mockPresenter]);
      mockRepository.getPresentationsWithScores.mockResolvedValue([
        mockPresentation,
      ]);
      mockRepository.getAwardedPanelists.mockResolvedValue([]);
      mockCertificateGenerator.generate.mockResolvedValue(Buffer.from('pdf'));
      mockRepository.create.mockResolvedValue(mockCertificate);
      mockMessagingService.publish.mockResolvedValue(undefined);

      const result = await service.generateAll('edition-1');

      expect(result).toHaveLength(1);
      expect(mockCertificateGenerator.generate).toHaveBeenCalledTimes(1);
      expect(mockMessagingService.publish).toHaveBeenCalledTimes(1);
      expect(mockMessagingService.publish).toHaveBeenCalledWith(
        'certificate-email',
        expect.objectContaining({
          certificateId: 'cert-1',
          userId: 'user-presenter',
          email: 'alice@ufba.br',
        }),
      );
    });

    it('should generate certificates for a panelist (professor)', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.deleteByEdition.mockResolvedValue({ count: 0 });
      mockRepository.getParticipants.mockResolvedValue([mockProfessor]);
      mockRepository.getPresentationsWithScores.mockResolvedValue([
        mockPresentation,
      ]);
      mockRepository.getAwardedPanelists.mockResolvedValue([]);
      mockCertificateGenerator.generate.mockResolvedValue(Buffer.from('pdf'));
      mockRepository.create.mockResolvedValue({
        ...mockCertificate,
        userId: 'user-professor',
      });
      mockMessagingService.publish.mockResolvedValue(undefined);

      const result = await service.generateAll('edition-1');

      expect(result).toHaveLength(1);
      expect(mockCertificateGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it('should include award info for a presenter who is awarded (public and evaluators)', async () => {
      const awardedPresentation = {
        ...mockPresentation,
        publicAverageScore: 5.0,
        evaluatorsAverageScore: 5.0,
      };

      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.deleteByEdition.mockResolvedValue({ count: 0 });
      mockRepository.getParticipants.mockResolvedValue([mockPresenter]);
      mockRepository.getPresentationsWithScores.mockResolvedValue([
        awardedPresentation,
      ]);
      mockRepository.getAwardedPanelists.mockResolvedValue([
        { userId: 'user-presenter', eventEditionId: 'edition-1' },
      ]);
      mockCertificateGenerator.generate.mockResolvedValue(Buffer.from('pdf'));
      mockRepository.create.mockResolvedValue(mockCertificate);
      mockMessagingService.publish.mockResolvedValue(undefined);

      const result = await service.generateAll('edition-1');

      expect(result).toHaveLength(1);
      expect(mockCertificateGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          awards: expect.arrayContaining([expect.any(String)]),
        }),
      );
    });

    it('should throw NotFoundException when edition does not exist', async () => {
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(service.generateAll('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMy', () => {
    it('should return certificates for the logged-in user', async () => {
      mockRepository.findByUser.mockResolvedValue([mockCertificateWithUser]);

      const result = await service.findMy('user-presenter');

      expect(result).toHaveLength(1);
      expect(mockRepository.findByUser).toHaveBeenCalledWith('user-presenter');
    });

    it('should return empty array when user has no certificates', async () => {
      mockRepository.findByUser.mockResolvedValue([]);

      const result = await service.findMy('user-none');

      expect(result).toHaveLength(0);
    });
  });

  describe('download', () => {
    it('should allow download when user is the certificate owner', async () => {
      mockRepository.findById.mockResolvedValue(mockCertificate);

      const result = await service.download(
        'cert-1',
        'user-presenter',
        'Default',
      );

      expect(result).toEqual(mockCertificate);
    });

    it('should allow download when user is Admin', async () => {
      mockRepository.findById.mockResolvedValue(mockCertificate);

      const result = await service.download('cert-1', 'other-user', 'Admin');

      expect(result).toEqual(mockCertificate);
    });

    it('should allow download when user is Superadmin', async () => {
      mockRepository.findById.mockResolvedValue(mockCertificate);

      const result = await service.download(
        'cert-1',
        'other-user',
        'Superadmin',
      );

      expect(result).toEqual(mockCertificate);
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      mockRepository.findById.mockResolvedValue(mockCertificate);

      await expect(
        service.download('cert-1', 'other-user', 'Default'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when certificate does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.download('nonexistent', 'user-presenter', 'Default'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
