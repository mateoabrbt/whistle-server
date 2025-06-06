import { Injectable } from '@nestjs/common';

import { Message, Prisma } from 'generated/prisma';

import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async message(
    messageWhereUniqueInput: Prisma.MessageWhereUniqueInput,
  ): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: messageWhereUniqueInput,
    });
  }

  async messages(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MessageWhereInput;
    cursor?: Prisma.MessageWhereUniqueInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
  }): Promise<Message[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.message.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createMessage(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({
      data,
    });
  }

  async updateMessage(params: {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.MessageUpdateInput;
  }): Promise<Message> {
    const { where, data } = params;

    return this.prisma.message.update({
      data,
      where,
    });
  }

  async deleteMessage(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    return this.prisma.message.delete({
      where,
    });
  }
}
