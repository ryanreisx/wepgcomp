import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsUUID()
  @IsNotEmpty()
  advisorId: string;

  @IsUUID()
  @IsNotEmpty()
  eventEditionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  abstract: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  coAdvisor?: string;

  @IsUUID()
  @IsOptional()
  proposedPresentationBlockId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  proposedPositionWithinBlock?: number;
}
