import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEventEditionDto } from './create-event-edition.dto';

export class UpdateEventEditionDto extends PartialType(CreateEventEditionDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
