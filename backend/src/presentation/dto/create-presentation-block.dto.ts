import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PresentationBlockType } from '@prisma/client';

export class CreatePresentationBlockDto {
  @IsUUID()
  @IsNotEmpty()
  eventEditionId: string;

  @IsUUID()
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
