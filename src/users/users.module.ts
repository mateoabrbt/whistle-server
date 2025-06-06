import { Module } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { UsersService } from './users.service';
import { AuthService } from '@auth/auth.service';
import { UsersController } from './users.controller';
import { RevokedService } from '@revoked/revoked.service';

@Module({
  providers: [UsersService, AuthService, RevokedService, PrismaService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
