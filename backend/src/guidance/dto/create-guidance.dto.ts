import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateGuidanceDto {
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: '$property must be a UUID' })
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
