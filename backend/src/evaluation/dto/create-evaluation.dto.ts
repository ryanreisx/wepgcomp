import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateEvaluationDto {
  @IsUUID()
  @IsNotEmpty()
  evaluationCriteriaId: string;

  @IsUUID()
  @IsNotEmpty()
  submissionId: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
