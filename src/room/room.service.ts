import { Injectable, NotFoundException } from '@nestjs/common';

import { Room, Prisma } from 'generated/prisma';

import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async room(params: {
    roomWhereUniqueInput: Prisma.RoomWhereUniqueInput;
    include?: Prisma.RoomInclude;
  }): Promise<Room | null> {
    const { include, roomWhereUniqueInput } = params;

    return this.prisma.room.findUnique({
      where: roomWhereUniqueInput,
      include,
    });
  }

  async rooms(params: {
    skip?: number;
    take?: number;
    include?: Prisma.RoomInclude;
    where?: Prisma.RoomWhereInput;
    cursor?: Prisma.RoomWhereUniqueInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput;
  }): Promise<Room[]> {
    const { skip, take, cursor, where, orderBy, include } = params;

    return this.prisma.room.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
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

  async checkMembership(params: {
    include?: Prisma.RoomInclude;
    roomWhereUniqueInput: Prisma.RoomWhereUniqueInput;
  }): Promise<Room> {
    const { include, roomWhereUniqueInput } = params;

    const room = await this.room({ include, roomWhereUniqueInput });

    if (!room) {
      throw new NotFoundException(
        'This room does not exist or you are not a member',
      );
    }

    return room;
  }
}
