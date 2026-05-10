import { PartialType } from '@nestjs/mapped-types';
import { CreatePresentationBlockDto } from './create-presentation-block.dto';

export class UpdatePresentationBlockDto extends PartialType(
  CreatePresentationBlockDto,
) {}
