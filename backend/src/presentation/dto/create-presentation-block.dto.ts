import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PresentationBlockType } from '@prisma/client';

export class CreatePresentationBlockDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsNotEmpty()
  eventEditionId: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsOptional()
  roomId?: string;

  @IsEnum(PresentationBlockType)
  @IsNotEmpty()
  type: PresentationBlockType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  speakerName?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(1)
  duration: number;
}
