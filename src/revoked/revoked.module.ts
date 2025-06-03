import { Module } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { RevokedService } from './revoked.service';

@Module({
  providers: [RevokedService, PrismaService],
  exports: [RevokedService],
})
export class RevokedModule {}
