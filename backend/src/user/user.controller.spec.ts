import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Profile, UserLevel } from '@prisma/client';

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

const mockUserService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findPendingProfessors: jest.fn(),
  approveProfessor: jest.fn(),
  rejectProfessor: jest.fn(),
  updateLevel: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      mockUserService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();

      expect(result).toEqual({ data: [mockUser] });
      expect(mockUserService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /users/pending', () => {
    it('should return pending professors', async () => {
      const pendingProf = {
        ...mockUser,
        profile: Profile.Professor,
        isActive: false,
      };
      mockUserService.findPendingProfessors.mockResolvedValue([pendingProf]);

      const result = await controller.findPending();

      expect(result).toEqual({ data: [pendingProf] });
      expect(mockUserService.findPendingProfessors).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('uuid-1');

      expect(result).toEqual({ data: mockUser });
      expect(mockUserService.findById).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user and return result', async () => {
      const updatedUser = { ...mockUser, name: 'João Updated' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('uuid-1', {
        name: 'João Updated',
      });

      expect(result).toEqual({
        data: updatedUser,
        message: 'User updated successfully',
      });
      expect(mockUserService.update).toHaveBeenCalledWith('uuid-1', {
        name: 'João Updated',
      });
    });
  });

  describe('DELETE /users/:id', () => {
    it('should remove user and return 204', async () => {
      mockUserService.remove.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await controller.remove('uuid-1');

      expect(mockUserService.remove).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('PATCH /users/:id/approve', () => {
    it('should approve professor', async () => {
      const approvedUser = { ...mockUser, isActive: true };
      mockUserService.approveProfessor.mockResolvedValue(approvedUser);

      const result = await controller.approve('uuid-1');

      expect(result).toEqual({
        data: approvedUser,
        message: 'Professor approved successfully',
      });
      expect(mockUserService.approveProfessor).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('PATCH /users/:id/reject', () => {
    it('should reject professor', async () => {
      const rejectedUser = { ...mockUser, isVerified: false };
      mockUserService.rejectProfessor.mockResolvedValue(rejectedUser);

      const result = await controller.reject('uuid-1');

      expect(result).toEqual({
        data: rejectedUser,
        message: 'Professor rejected successfully',
      });
      expect(mockUserService.rejectProfessor).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('PATCH /users/:id/level', () => {
    it('should update user level passing caller level', async () => {
      const updatedUser = { ...mockUser, level: UserLevel.Admin };
      mockUserService.updateLevel.mockResolvedValue(updatedUser);

      const caller = { sub: 'caller-1', level: UserLevel.Superadmin };
      const result = await controller.updateLevel(
        'uuid-1',
        { level: UserLevel.Admin },
        caller,
      );

      expect(result).toEqual({
        data: updatedUser,
        message: 'User level updated successfully',
      });
      expect(mockUserService.updateLevel).toHaveBeenCalledWith(
        'uuid-1',
        UserLevel.Admin,
        UserLevel.Superadmin,
      );
    });
  });
});
