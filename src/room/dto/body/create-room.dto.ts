import { IsArray, IsString, IsNotEmpty, IsOptional } from 'class-validator';

class ParticipantsDto {
  @IsString()
  id: string;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsArray()
  @IsOptional()
  users: ParticipantsDto[] | null;
}
