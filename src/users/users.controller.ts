import { Request } from 'express';
import { User } from 'generated/prisma';
import {
  Req,
  Get,
  Body,
  Patch,
  Controller,
  NotFoundException,
} from '@nestjs/common';

import { MeDto } from '@users/dto/me.dto';
import { AuthService } from '@auth/auth.service';
import { UsersService } from '@users/users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Get('me')
  async me(@Req() request: Request): Promise<User> {
    const { sub } = this.auth.getCurrentUser(request);

    const existingUser = await this.users.user({ id: sub });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${sub} not found`);
    }

    return existingUser;
  }

  @Patch('me')
  async updateMe(@Req() request: Request, @Body() data: MeDto): Promise<User> {
    const { sub } = this.auth.getCurrentUser(request);

    return this.users.updateUser({
      where: { id: sub },
      data,
    });
  }
}
