import { SetMetadata } from '@nestjs/common';
import { UserLevel } from '@prisma/client';

export const LEVELS_KEY = 'levels';
export const Levels = (...levels: UserLevel[]) =>
  SetMetadata(LEVELS_KEY, levels);
