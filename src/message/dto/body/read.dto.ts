import { IsNotEmpty, IsString } from 'class-validator';

export class ReadMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;
}
