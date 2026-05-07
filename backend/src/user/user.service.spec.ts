import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Profile, UserLevel } from '@prisma/client';

jest.mock('bcrypt');

const mockUser = {
  id: 'uuid-1',
  name: 'João Silva',
  email: 'joao@ufba.br',
  password: '$2b$10$hashedpassword',
  registrationNumber: '12345',
  photoFilePath: null,
  profile: Profile.DoctoralStudent,
  level: UserLevel.Default,
  isActive: true,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'João Silva',
      email: 'joao@ufba.br',
      password: 'Senha1234!',
      profile: Profile.DoctoralStudent,
    };

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('joao@ufba.br');
    });

    it('should hash the password before saving', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      mockRepository.create.mockResolvedValue(mockUser);

      await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('Senha1234!', 10);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$2b$10$hashedpassword' }),
      );
    });

    it('should return user without password field', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      mockRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-1');

      expect(result).toHaveProperty('id', 'uuid-1');
      expect(mockRepository.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      mockRepository.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return updated user', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, name: 'João Updated' };
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('uuid-1', { name: 'João Updated' });

      expect(result).toHaveProperty('name', 'João Updated');
      expect(mockRepository.update).toHaveBeenCalledWith('uuid-1', {
        name: 'João Updated',
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should mark user as inactive', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      const deactivatedUser = { ...mockUser, isActive: false };
      mockRepository.update.mockResolvedValue(deactivatedUser);

      const result = await service.remove('uuid-1');

      expect(result.isActive).toBe(false);
      expect(mockRepository.update).toHaveBeenCalledWith('uuid-1', {
        isActive: false,
        advisedSubmissions: { set: [] },
        authoredSubmissions: { set: [] },
        evaluations: { set: [] },
        panelists: { set: [] },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findPendingProfessors', () => {
    it('should call findAll and filter pending professors', async () => {
      const pendingProf = {
        ...mockUser,
        profile: Profile.Professor,
        isVerified: true,
        isActive: false,
      };
      mockRepository.findAll.mockResolvedValue([mockUser, pendingProf]);

      const result = await service.findPendingProfessors();

      expect(result).toHaveLength(1);
      expect(result[0].profile).toBe(Profile.Professor);
    });
  });

  describe('approveProfessor', () => {
    it('should mark professor as active', async () => {
      const pendingProf = {
        ...mockUser,
        profile: Profile.Professor,
        isActive: false,
      };
      mockRepository.findById.mockResolvedValue(pendingProf);
      mockRepository.update.mockResolvedValue({
        ...pendingProf,
        isActive: true,
      });

      const result = await service.approveProfessor('uuid-1');

      expect(result.isActive).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith('uuid-1', {
        isActive: true,
      });
    });
  });

  describe('rejectProfessor', () => {
    it('should mark professor with rejection status', async () => {
      const pendingProf = {
        ...mockUser,
        profile: Profile.Professor,
        isVerified: true,
        isActive: false,
      };
      mockRepository.findById.mockResolvedValue(pendingProf);
      mockRepository.update.mockResolvedValue({
        ...pendingProf,
        isVerified: false,
      });

      const result = await service.rejectProfessor('uuid-1');

      expect(result.isVerified).toBe(false);
      expect(mockRepository.update).toHaveBeenCalledWith('uuid-1', {
        isVerified: false,
      });
    });
  });

  describe('updateLevel', () => {
    it('should update user level', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        level: UserLevel.Superadmin,
      });

      const result = await service.updateLevel('uuid-1', UserLevel.Superadmin);

      expect(result.level).toBe(UserLevel.Superadmin);
      expect(mockRepository.update).toHaveBeenCalledWith('uuid-1', {
        level: UserLevel.Superadmin,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateLevel('nonexistent', UserLevel.Admin),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
