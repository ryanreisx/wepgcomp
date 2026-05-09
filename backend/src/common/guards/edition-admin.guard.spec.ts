import {
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EditionAdminGuard } from './edition-admin.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('EditionAdminGuard', () => {
  let guard: EditionAdminGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrisma = {
    committeeMember: {
      findFirst: jest.fn(),
    },
  };

  function createMockContext(overrides: {
    user?: Record<string, unknown>;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
  }): ExecutionContext {
    const request = {
      user: overrides.user,
      body: overrides.body ?? {},
      query: overrides.query ?? {},
      params: overrides.params ?? {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = mockReflector as unknown as Reflector;
    prisma = mockPrisma as unknown as PrismaService;
    guard = new EditionAdminGuard(reflector, prisma);
    jest.clearAllMocks();
  });

  it('should allow when @EditionAdmin() is not set', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw 400 when eventEditionId is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should allow Superadmin without CommitteeMember', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Superadmin' },
      body: { eventEditionId: 'edition-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.committeeMember.findFirst).not.toHaveBeenCalled();
  });

  it('should allow CommitteeMember with active edition and future endDate', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue({ id: 'cm-1' });
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      body: { eventEditionId: 'edition-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.committeeMember.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        eventEditionId: 'edition-1',
        eventEdition: {
          isActive: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          endDate: { gte: expect.any(Date) },
        },
      },
    });
  });

  it('should reject CommitteeMember of another edition', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue(null);
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      body: { eventEditionId: 'edition-other' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should reject when edition is inactive', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue(null);
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      body: { eventEditionId: 'edition-inactive' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should reject when edition endDate is in the past', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue(null);
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      body: { eventEditionId: 'edition-past' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should read eventEditionId from query when not in body', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue({ id: 'cm-1' });
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      query: { eventEditionId: 'edition-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.committeeMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({ eventEditionId: 'edition-1' }),
      }),
    );
  });

  it('should read eventEditionId from params when not in body or query', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue({ id: 'cm-1' });
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      params: { eventEditionId: 'edition-1' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.committeeMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({ eventEditionId: 'edition-1' }),
      }),
    );
  });

  it('should prioritize body over query and params', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockPrisma.committeeMember.findFirst.mockResolvedValue({ id: 'cm-1' });
    const context = createMockContext({
      user: { sub: 'user-1', level: 'Default' },
      body: { eventEditionId: 'from-body' },
      query: { eventEditionId: 'from-query' },
      params: { eventEditionId: 'from-params' },
    });

    await guard.canActivate(context);

    expect(mockPrisma.committeeMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({ eventEditionId: 'from-body' }),
      }),
    );
  });
});
