import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { CommitteeLevel, CommitteeRole } from '@prisma/client';

export class CreateCommitteeMemberDto {
  @IsUUID()
  @IsNotEmpty()
  eventEditionId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(CommitteeLevel)
  @IsNotEmpty()
  level: CommitteeLevel;

  @IsEnum(CommitteeRole)
  @IsNotEmpty()
  role: CommitteeRole;
}
