import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { PanelistStatus } from '@prisma/client';

export class CreatePanelistDto {
  @IsUUID()
  @IsNotEmpty()
  presentationBlockId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PanelistStatus)
  @IsOptional()
  status?: PanelistStatus;
}
