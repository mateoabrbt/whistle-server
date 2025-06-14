import { Module, forwardRef } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { UsersService } from '@users/users.service';

import { RoomModule } from '@room/room.module';
import { AuthService } from '@auth/auth.service';
import { MessageService } from './message.service';
import { RevokedModule } from '@revoked/revoked.module';
import { StatusService } from './status/status.service';
import { MessageController } from './message.controller';

@Module({
  controllers: [MessageController],
  exports: [MessageService, StatusService],
  imports: [RevokedModule, forwardRef(() => RoomModule)],
  providers: [
    AuthService,
    UsersService,
    StatusService,
    PrismaService,
    MessageService,
  ],
})
export class MessageModule {}
