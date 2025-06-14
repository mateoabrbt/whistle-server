import { Injectable } from '@nestjs/common';

import { Message, Prisma } from 'generated/prisma';

import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async message(params: {
    include?: Prisma.MessageInclude;
    where: Prisma.MessageWhereUniqueInput;
  }): Promise<Message | null> {
    const { include, where } = params;

    return this.prisma.message.findUnique({
      where,
      include,
    });
  }

  async messages(params: {
    skip?: number;
    take?: number;
    select?: Prisma.MessageSelect;
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
    data: Prisma.MessageCreateInput;
    include?: Prisma.MessageInclude;
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

  async deleteMessage(
    messageWhereUniqueInput: Prisma.MessageWhereUniqueInput,
  ): Promise<Message> {
    return this.prisma.message.delete({
      where: messageWhereUniqueInput,
    });
  }
}
