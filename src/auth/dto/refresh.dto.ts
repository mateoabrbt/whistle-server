import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWJmb2ZrZ3UwMDAwczVzcnQxanB3MGk4IiwiaWF0IjoxNzQ4OTUzNDE5LCJleHAiOjE3NTE1NDU0MTl9.uLE0c4kBVgtq7h5qhnzonMm55sEe-iHJ2AEzKMaSmeY',
    description: 'The refresh token used to obtain a new access token',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
