import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserLevel } from '@prisma/client';
import { LEVELS_KEY } from '../decorators/levels.decorator';

const LEVEL_HIERARCHY: Record<string, number> = {
  [UserLevel.Default]: 0,
  [UserLevel.Admin]: 1,
  [UserLevel.Superadmin]: 2,
};

@Injectable()
export class LevelsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevels = this.reflector.getAllAndOverride<UserLevel[]>(
      LEVELS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredLevels) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { level: string } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Insufficient level');
    }

    const userRank = LEVEL_HIERARCHY[user.level] ?? 0;
    const minRequiredRank = Math.min(
      ...requiredLevels.map((l) => LEVEL_HIERARCHY[l] ?? 0),
    );

    if (userRank < minRequiredRank) {
      throw new ForbiddenException('Insufficient level');
    }

    return true;
  }
}
