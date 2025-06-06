import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
