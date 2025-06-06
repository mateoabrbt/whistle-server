import { Injectable, NotFoundException } from '@nestjs/common';

import { Room, Prisma } from 'generated/prisma';

import { PrismaService } from '@prisma/prisma.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async room(
    roomWhereUniqueInput: Prisma.RoomWhereUniqueInput,
  ): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: roomWhereUniqueInput,
    });
  }

  async rooms(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RoomWhereInput;
    cursor?: Prisma.RoomWhereUniqueInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput;
  }): Promise<Room[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.room.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createRoom(data: Prisma.RoomCreateInput): Promise<Room> {
    return this.prisma.room.create({
      data,
    });
  }

  async updateRoom(params: {
    where: Prisma.RoomWhereUniqueInput;
    data: Prisma.RoomUpdateInput;
  }): Promise<Room> {
    const { where, data } = params;

    return this.prisma.room.update({
      data,
      where,
    });
  }

  async deleteRoom(where: Prisma.RoomWhereUniqueInput): Promise<Room> {
    return this.prisma.room.delete({
      where,
    });
  }

  async checkMembership(
    roomWhereUniqueInput: Prisma.RoomWhereUniqueInput,
    exceptionType: 'NotFoundException' | 'WsException' = 'NotFoundException',
  ): Promise<Room> {
    const room = await this.room(roomWhereUniqueInput);

    if (!room) {
      const exceptionMessage =
        'This room does not exist or you are not a member';
      if (exceptionType === 'WsException') {
        throw new WsException(exceptionMessage);
      } else {
        throw new NotFoundException(exceptionMessage);
      }
    }

    return room;
  }
}
