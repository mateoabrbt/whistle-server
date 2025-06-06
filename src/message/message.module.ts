import { Module } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { UsersService } from '@users/users.service';

import { MessageService } from './message.service';

@Module({
  providers: [MessageService, UsersService, PrismaService],
  exports: [MessageService],
})
export class MessageModule {}
