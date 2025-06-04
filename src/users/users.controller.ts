import { Request } from 'express';
import { User } from 'generated/prisma';
import {
  Req,
  Get,
  Body,
  Patch,
  Controller,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { MeDto } from '@users/dto/me.dto';
import { UsersService } from '@users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@Req() request: Request): Promise<User> {
    const user = request['user'] as JwtPayload;

    if (!user || typeof user.sub !== 'string') {
      throw new UnauthorizedException('Invalid user or token information');
    }

    const existingUser = await this.users.user({ id: user.sub });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${user.sub} not found`);
    }

    return existingUser;
  }

  @Patch('me')
  async updateMe(@Req() request: Request, @Body() data: MeDto): Promise<User> {
    const user = request['user'] as JwtPayload;

    if (!user || typeof user.sub !== 'string') {
      throw new UnauthorizedException('Invalid user or token information');
    }

    return this.users.updateUser({
      where: { id: user.sub },
      data,
    });
  }
}
