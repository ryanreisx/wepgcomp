import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEvaluationCriteriaDto {
  @IsUUID()
  @IsNotEmpty()
  eventEditionId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  weightRadio?: number;
}
