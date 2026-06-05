import { IsEnum, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { PanelistStatus } from '@prisma/client';

export class CreatePanelistDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsNotEmpty()
  presentationBlockId: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsNotEmpty()
  userId: string;

  @IsEnum(PanelistStatus)
  @IsOptional()
  status?: PanelistStatus;
}
