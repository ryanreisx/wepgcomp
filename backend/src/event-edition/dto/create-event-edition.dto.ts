import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEventEditionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  callForPapersText: string;

  @IsString()
  @IsNotEmpty()
  partnersText: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsDateString()
  @IsNotEmpty()
  submissionStartDate: string;

  @IsDateString()
  @IsNotEmpty()
  submissionDeadline: string;

  @IsBoolean()
  @IsOptional()
  isEvaluationRestrictToLoggedUsers?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  presentationDuration?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  presentationsPerPresentationBlock?: number;
}
