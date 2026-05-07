import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserLevel } from '@prisma/client';

export class UpdateLevelDto {
  @IsEnum(UserLevel)
  @IsNotEmpty()
  level: UserLevel;
}
