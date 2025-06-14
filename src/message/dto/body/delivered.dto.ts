import { IsNotEmpty, IsString } from 'class-validator';

export class DeliveredMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;
}
