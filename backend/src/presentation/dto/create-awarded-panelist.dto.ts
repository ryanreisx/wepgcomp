import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAwardedPanelistDto {
  @IsUUID()
  @IsNotEmpty()
  eventEditionId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
