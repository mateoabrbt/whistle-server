import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { RoomModule } from '@room/room.module';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { RevokedModule } from '@revoked/revoked.module';
import { MessageModule } from '@message/message.module';

@Module({
  imports: [
    AuthModule,
    RoomModule,
    UsersModule,
    MessageModule,
    RevokedModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
