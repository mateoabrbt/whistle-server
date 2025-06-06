import { IsNotEmpty, IsString } from 'class-validator';

export class IdDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
