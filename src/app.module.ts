import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { RevokedModule } from './revoked/revoked.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RevokedModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
