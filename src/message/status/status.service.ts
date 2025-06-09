import { MessageStatus, Prisma } from 'generated/prisma';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  async messageStatus(
    messageStatusWhereUniqueInput: Prisma.MessageStatusWhereUniqueInput,
  ): Promise<MessageStatus | null> {
    return this.prisma.messageStatus.findUnique({
      where: messageStatusWhereUniqueInput,
    });
  }

  async createMessageStatus(
    data: Prisma.MessageStatusCreateInput,
  ): Promise<MessageStatus> {
    return this.prisma.messageStatus.create({
      data,
    });
  }

  async deleteMessageStatus(
    where: Prisma.MessageStatusWhereUniqueInput,
  ): Promise<MessageStatus> {
    return this.prisma.messageStatus.delete({
      where,
    });
  }
}
