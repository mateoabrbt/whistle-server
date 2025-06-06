import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
