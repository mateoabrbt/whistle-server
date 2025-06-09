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
    include?: Prisma.MessageInclude;
    where?: Prisma.MessageWhereInput;
    cursor?: Prisma.MessageWhereUniqueInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
  }): Promise<Message[]> {
    const { skip, take, cursor, where, include, orderBy } = params;

    return this.prisma.message.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  async createMessage(params: {
    include?: Prisma.MessageInclude;
    data: Prisma.MessageCreateInput;
  }): Promise<Message> {
    const { data, include } = params;

    return this.prisma.message.create({
      data,
      include,
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
