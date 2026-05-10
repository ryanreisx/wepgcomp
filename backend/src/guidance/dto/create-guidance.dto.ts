import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGuidanceDto {
  @IsUUID()
  @IsNotEmpty()
  eventEditionId: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  authorGuidance?: string;

  @IsString()
  @IsOptional()
  reviewerGuidance?: string;

  @IsString()
  @IsOptional()
  audienceGuidance?: string;
}
