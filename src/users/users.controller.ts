import { Request } from 'express';
import { User } from 'generated/prisma';
import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@Req() request: Request): Promise<User> {
    const user = request['user'] as JwtPayload;

    if (!user || typeof user.sub !== 'string') {
      throw new UnauthorizedException('Invalid user or token information');
    }

    const me = await this.users.user({ id: user.sub });
    if (!me) {
      throw new NotFoundException('User not found');
    }

    return me;
  }
}
