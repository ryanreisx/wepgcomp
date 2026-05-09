import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { Profile, UserLevel } from '@prisma/client';

jest.mock('bcrypt');

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

const fullMockUser = {
  ...baseMockUser,
  password: '$2b$10$hashedpassword',
  isVerified: true,
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

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-jwt-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      JWT_SECRET: 'test-secret',
      BCRYPT_SALT_ROUNDS: 10,
    };
    return config[key] ?? defaultValue;
  }),
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
  committeeMember: {
    findFirst: jest.fn(),
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
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
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

  describe('login', () => {
    const loginDto = { email: 'joao@ufba.br', password: 'Abcd1234!' };

    it('should return token and user on valid login', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(fullMockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token', 'signed-jwt-token');
      expect(result.user).toHaveProperty('id', 'uuid-1');
      expect(result.user).toHaveProperty('email', 'joao@ufba.br');
      expect(result.user).not.toHaveProperty('password');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        profile: Profile.DoctoralStudent,
        level: UserLevel.Default,
      });
    });

    it('should throw UnauthorizedException when email not found', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(fullMockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when user not verified', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue({
        ...fullMockUser,
        isVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user inactive', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue({
        ...fullMockUser,
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('forgotPassword', () => {
    it('should publish reset token to RabbitMQ when email exists', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(fullMockUser);

      const result = await service.forgotPassword({ email: 'joao@ufba.br' });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'uuid-1', type: 'password-reset' },
        { expiresIn: '1h' },
      );
      expect(mockMessagingService.publish).toHaveBeenCalledWith(
        'email-send',
        expect.objectContaining({
          email: 'joao@ufba.br',
          type: 'password-reset',
        }),
      );
      expect(result).toHaveProperty('message');
    });

    it('should return same message when email does not exist (no leak)', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nonexistent@ufba.br',
      });

      expect(mockMessagingService.publish).not.toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'uuid-1',
        type: 'password-reset',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhashedpassword');

      const result = await service.resetPassword({
        token: 'valid-reset-token',
        password: 'NewPass1234!',
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-reset-token', {
        secret: 'test-secret',
      });
      expect(mockPrismaService.userAccount.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { password: '$2b$10$newhashedpassword' },
      });
      expect(result).toHaveProperty('message', 'Password reset successfully');
    });

    it('should throw BadRequestException on invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          password: 'NewPass1234!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on wrong token type', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'uuid-1',
        type: 'email-verification',
      });

      await expect(
        service.resetPassword({
          token: 'wrong-type-token',
          password: 'NewPass1234!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on weak password', async () => {
      await expect(
        service.resetPassword({ token: 'valid-token', password: 'weak' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user with isCommitteeOfActiveEdition = false when no committee member', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(fullMockUser);
      mockPrismaService.committeeMember.findFirst.mockResolvedValue(null);

      const result = await service.getMe('uuid-1');

      expect(result.isCommitteeOfActiveEdition).toBe(false);
      expect(result).toHaveProperty('id', 'uuid-1');
      expect(result).not.toHaveProperty('password');
    });

    it('should return user with isCommitteeOfActiveEdition = true when committee member of active edition', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(fullMockUser);
      mockPrismaService.committeeMember.findFirst.mockResolvedValue({
        id: 'cm-1',
        userId: 'uuid-1',
        eventEditionId: 'ee-1',
      });

      const result = await service.getMe('uuid-1');

      expect(result.isCommitteeOfActiveEdition).toBe(true);
    });

    it('should return user with isCommitteeOfActiveEdition = false when committee member of inactive edition', async () => {
      mockPrismaService.userAccount.findUnique.mockResolvedValue(fullMockUser);
      mockPrismaService.committeeMember.findFirst.mockResolvedValue(null);

      const result = await service.getMe('uuid-1');

      expect(result.isCommitteeOfActiveEdition).toBe(false);
    });
  });
});
