import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EDITION_ADMIN_KEY } from '../decorators/edition-admin.decorator';

@Injectable()
export class EditionAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isEditionAdmin = this.reflector.getAllAndOverride<boolean>(
      EDITION_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!isEditionAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user: { sub: string; level: string };
      body: Record<string, unknown>;
      query: Record<string, unknown>;
      params: Record<string, unknown>;
    }>();

    const eventEditionId =
      (request.body?.eventEditionId as string) ??
      (request.query?.eventEditionId as string) ??
      (request.params?.eventEditionId as string);

    if (!eventEditionId) {
      throw new BadRequestException('eventEditionId is required');
    }

    if (request.user.level === UserLevel.Superadmin) {
      return true;
    }

    const member = await this.prisma.committeeMember.findFirst({
      where: {
        userId: request.user.sub,
        eventEditionId,
        eventEdition: {
          isActive: true,
          endDate: { gte: new Date() },
        },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'Acesso restrito a administradores da edição',
      );
    }

    return true;
  }
}
