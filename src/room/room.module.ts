import { Module, forwardRef } from '@nestjs/common';

import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { AuthService } from '@auth/auth.service';
import { RoomController } from './room.controller';
import { UsersService } from '@users/users.service';
import { PrismaService } from '@prisma/prisma.service';
import { RevokedModule } from '@revoked/revoked.module';
import { MessageModule } from '@message/message.module';

@Module({
  controllers: [RoomController],
  exports: [RoomService, RoomGateway],
  imports: [RevokedModule, forwardRef(() => MessageModule)],
  providers: [
    AuthService,
    RoomService,
    RoomGateway,
    UsersService,
    PrismaService,
  ],
})
export class RoomModule {}
