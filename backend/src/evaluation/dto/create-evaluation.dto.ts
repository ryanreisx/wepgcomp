import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateEvaluationDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
  @IsNotEmpty()
  evaluationCriteriaId: string;

  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
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
