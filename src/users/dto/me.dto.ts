import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, Matches, IsString, IsOptional } from 'class-validator';

export class MeDto {
  @ApiPropertyOptional({
    example: 'johndoe@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    example: 'John_123',
    description:
      'Username, it must be 3-15 characters long and can only contain letters, numbers, and underscores.',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,15}$/, {
    message:
      'Username must be 3-15 characters long and can only contain letters, numbers, and underscores.',
  })
  username: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsOptional()
  firstName: string | null;

  @ApiPropertyOptional({
    example: 'Doe',
    nullable: true,
    description: 'User last name',
  })
  @IsString()
  @IsOptional()
  lastName: string | null;
}
