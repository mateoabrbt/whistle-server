import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RevokedToken } from 'generated/prisma';

import { PrismaService } from '@prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RevokedService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(RevokedService.name);

  async revokedToken(
    revokedTokenWhereUniqueInput: Prisma.RevokedTokenWhereUniqueInput,
  ): Promise<RevokedToken | null> {
    return this.prisma.revokedToken.findUnique({
      where: revokedTokenWhereUniqueInput,
    });
  }

  async createRevokedToken(
    data: Prisma.RevokedTokenCreateInput,
  ): Promise<RevokedToken> {
    return this.prisma.revokedToken.create({
      data,
    });
  }

  async deleteRevokedToken(
    where: Prisma.RevokedTokenWhereUniqueInput,
  ): Promise<RevokedToken> {
    return this.prisma.revokedToken.delete({
      where,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cronDeleteExpiredRevokedTokens() {
    this.logger.log('Running cron job to delete expired revoked tokens...');
    const now = new Date();
    const result = await this.prisma.revokedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    this.logger.log(`Deleted ${result.count} expired revoked tokens.`);
  }
}
