import { IsNotEmpty, IsString } from 'class-validator';

export class ReceiveMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;
}
