import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class TypingDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsBoolean()
  @IsNotEmpty()
  isTyping: boolean;
}
