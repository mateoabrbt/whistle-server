import { Module } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { UsersService } from '@users/users.service';

import { MessageService } from './message.service';
import { StatusService } from './status/status.service';

@Module({
  providers: [MessageService, StatusService, UsersService, PrismaService],
  exports: [MessageService, StatusService],
})
export class MessageModule {}
