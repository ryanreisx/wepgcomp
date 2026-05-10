import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreatePresentationDto {
  @IsUUID()
  @IsNotEmpty()
  submissionId: string;

  @IsUUID()
  @IsNotEmpty()
  presentationBlockId: string;

  @IsInt()
  @Min(0)
  positionWithinBlock: number;
}
