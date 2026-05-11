import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluationCriteriaDto } from './create-evaluation-criteria.dto';

export class UpdateEvaluationCriteriaDto extends PartialType(
  CreateEvaluationCriteriaDto,
) {}
