import { IsNotEmpty, IsString } from 'class-validator';

export class ModifyMessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}
