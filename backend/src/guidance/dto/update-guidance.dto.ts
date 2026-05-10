import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateGuidanceDto } from './create-guidance.dto';

export class UpdateGuidanceDto extends PartialType(
  OmitType(CreateGuidanceDto, ['eventEditionId'] as const),
) {}
