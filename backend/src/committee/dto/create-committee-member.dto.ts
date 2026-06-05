import { IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { CommitteeLevel, CommitteeRole } from '@prisma/client';

export class CreateCommitteeMemberDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsNotEmpty()
  eventEditionId: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsNotEmpty()
  userId: string;

  @IsEnum(CommitteeLevel)
  @IsNotEmpty()
  level: CommitteeLevel;

  @IsEnum(CommitteeRole)
  @IsNotEmpty()
  role: CommitteeRole;
}
