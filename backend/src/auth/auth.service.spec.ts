import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { Profile, UserLevel } from '@prisma/client';

const baseMockUser = {
  id: 'uuid-1',
  name: 'João Silva',
  email: 'joao@ufba.br',
  registrationNumber: '12345',
  photoFilePath: null,
  profile: Profile.DoctoralStudent,
  level: UserLevel.Default,
  isActive: true,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEmailVerification = {
  id: 'ev-uuid-1',
  userId: 'uuid-1',
  emailVerificationToken: 'valid-token-uuid',
  emailVerifiedAt: null,
  emailVerificationSentAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserService = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const mockMessagingService = {
  publish: jest.fn().mockResolvedValue(undefined),
};

const mockPrismaService = {
  emailVerification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userAccount: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: MessagingService, useValue: mockMessagingService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a valid UFBA doctoral student', async () => {
      const dto = {
        name: 'João Silva',
        email: 'joao@ufba.br',
        password: 'Abcd1234!',
        registrationNumber: '12345',
        profile: Profile.DoctoralStudent,
      };

      mockUserService.create.mockResolvedValue(baseMockUser);
      mockPrismaService.emailVerification.create.mockResolvedValue(
        mockEmailVerification,
      );

      const result = await service.register(dto);

      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'joao@ufba.br',
          profile: Profile.DoctoralStudent,
        }),
      );
      expect(mockPrismaService.userAccount.update).not.toHaveBeenCalled();
      expect(mockPrismaService.emailVerification.create).toHaveBeenCalled();
      expect(mockMessagingService.publish).toHaveBeenCalledWith(
        'email-send',
        expect.objectContaining({ email: 'joao@ufba.br' }),
      );
      expect(result).toHaveProperty('message');
    });

    it('should register UFBA professor with isActive = false', async () => {
      const dto = {
        name: 'Prof Maria',
        email: 'maria@ufba.br',
        password: 'Abcd1234!',
        registrationNumber: '67890',
        profile: Profile.Professor,
      };

      const profUser = {
        ...baseMockUser,
        profile: Profile.Professor,
        isActive: false,
      };
      mockUserService.create.mockResolvedValue(profUser);
      mockPrismaService.emailVerification.create.mockResolvedValue(
        mockEmailVerification,
      );

      await service.register(dto);

      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: Profile.Professor,
        }),
      );
      expect(mockPrismaService.userAccount.update).toHaveBeenCalledWith({
        where: { id: profUser.id },
        data: { isActive: false },
      });
    });

    it('should register a listener with non-UFBA email', async () => {
      const dto = {
        name: 'Carlos Lima',
        email: 'carlos@gmail.com',
        password: 'Abcd1234!',
      };

      const listenerUser = {
        ...baseMockUser,
        email: 'carlos@gmail.com',
        profile: Profile.Listener,
      };
      mockUserService.create.mockResolvedValue(listenerUser);
      mockPrismaService.emailVerification.create.mockResolvedValue(
        mockEmailVerification,
      );

      await service.register(dto);

      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: Profile.Listener,
        }),
      );
      expect(mockPrismaService.userAccount.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate email', async () => {
      const dto = {
        name: 'João Silva',
        email: 'joao@ufba.br',
        password: 'Abcd1234!',
        registrationNumber: '12345',
        profile: Profile.DoctoralStudent,
      };

      mockUserService.create.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException on weak password', async () => {
      const dto = {
        name: 'João Silva',
        email: 'joao@ufba.br',
        password: 'weak',
        registrationNumber: '12345',
        profile: Profile.DoctoralStudent,
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when UFBA email lacks registrationNumber', async () => {
      const dto = {
        name: 'João Silva',
        email: 'joao@ufba.br',
        password: 'Abcd1234!',
        profile: Profile.DoctoralStudent,
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockPrismaService.emailVerification.findUnique.mockResolvedValue(
        mockEmailVerification,
      );
      mockPrismaService.emailVerification.update.mockResolvedValue({
        ...mockEmailVerification,
        emailVerifiedAt: new Date(),
      });
      mockPrismaService.userAccount.update.mockResolvedValue({
        ...baseMockUser,
        isVerified: true,
      });

      const result = await service.verifyEmail('valid-token-uuid');

      expect(
        mockPrismaService.emailVerification.findUnique,
      ).toHaveBeenCalledWith({
        where: { emailVerificationToken: 'valid-token-uuid' },
      });
      expect(mockPrismaService.userAccount.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { isVerified: true },
      });
      expect(result).toHaveProperty('message');
    });

    it('should throw BadRequestException on invalid token', async () => {
      mockPrismaService.emailVerification.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(baseMockUser);
      mockPrismaService.emailVerification.findUnique.mockResolvedValue(
        mockEmailVerification,
      );
      mockPrismaService.emailVerification.update.mockResolvedValue({
        ...mockEmailVerification,
        emailVerificationSentAt: new Date(),
      });

      const result = await service.resendVerification({
        email: 'joao@ufba.br',
      });

      expect(mockMessagingService.publish).toHaveBeenCalledWith(
        'email-send',
        expect.objectContaining({ email: 'joao@ufba.br' }),
      );
      expect(result).toHaveProperty('message');
    });
  });
});
