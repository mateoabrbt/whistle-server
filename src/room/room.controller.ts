import type { Request } from 'express';
import { Message, Room } from 'generated/prisma';
import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Param,
  HttpCode,
  Controller,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { IdDto } from './dto/param/id.dto';
import { RoomGateway } from './room.gateway';
import { RoomService } from '@room/room.service';
import { AuthService } from '@auth/auth.service';
import { UsersService } from '@users/users.service';
import { JoinRoomDto } from './dto/body/join.dto';
import { LeaveRoomDto } from './dto/body/leave.dto';
import { MessageService } from '@message/message.service';
import { PaginationDto } from './dto/query/pagination.dto';
import { CreateRoomDto } from '@room/dto/body/create.dto';
import { StatusService } from '@message/status/status.service';

@Controller('room')
export class RoomController {
  constructor(
    private readonly auth: AuthService,
    private readonly room: RoomService,
    private readonly users: UsersService,
    private readonly gateway: RoomGateway,
    private readonly status: StatusService,
    private readonly message: MessageService,
  ) {}

  @Post('create')
  async create(
    @Req() request: Request,
    @Body() body: CreateRoomDto,
  ): Promise<Room> {
    const { name, users, description } = body;
    const { sub } = this.auth.getCurrentUser(request);

    const members = Array.from(
      new Set([sub, ...(users ?? []).map((user) => user.userId)]),
    );

    const foundUsers = await this.users.users({
      where: {
        id: { in: members },
      },
    });

    const userIds = foundUsers.map((user) => user.id);
    const missingIds = members.filter((id) => !userIds.includes(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `User(s) not found: ${missingIds.join(', ')}`,
      );
    }

    return this.room.createRoom({
      name,
      description,
      users: {
        connect: members.map((id) => ({ id })),
      },
    });
  }

  @Post('join')
  @HttpCode(200)
  async joinRoom(
    @Req() request: Request,
    @Body() body: JoinRoomDto,
  ): Promise<Room> {
    const { roomId } = body;
    const { sub } = this.auth.getCurrentUser(request);

    const isUserAlreadyInRoom = await this.room.room({
      roomWhereUniqueInput: {
        id: roomId,
        users: { some: { id: sub } },
      },
    });

    if (isUserAlreadyInRoom)
      throw new BadRequestException('User already in room');

    const room = await this.room.updateRoom({
      where: { id: roomId },
      data: {
        users: {
          connect: [{ id: sub }],
        },
      },
    });

    this.gateway.server
      .to(roomId)
      .emit('userJoinedRoom', { userId: sub, roomId });

    return room;
  }

  @Post('leave')
  @HttpCode(200)
  async leaveRoom(
    @Req() request: Request,
    @Body() body: LeaveRoomDto,
  ): Promise<Room> {
    const { roomId } = body;
    const { sub } = this.auth.getCurrentUser(request);

    await this.room.checkMembership({
      roomWhereUniqueInput: {
        id: roomId,
        users: { some: { id: sub } },
      },
    });

    const room = await this.room.updateRoom({
      where: { id: roomId },
      data: {
        users: {
          disconnect: [{ id: sub }],
        },
      },
    });

    this.gateway.server
      .to(roomId)
      .emit('userLeftRoom', { userId: sub, roomId });

    return room;
  }

  @Get('all')
  async getAllRooms(@Req() request: Request): Promise<Room[]> {
    const { sub } = this.auth.getCurrentUser(request);

    return this.room.rooms({
      where: {
        users: { some: { id: sub } },
      },
      orderBy: { updatedAt: 'asc' },
      include: {
        users: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, username: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });
  }

  @Post('all/messages/delivered')
  @HttpCode(200)
  async markMessagesDelivered(
    @Req() request: Request,
  ): Promise<{ count: number; message: string }> {
    const { sub } = this.auth.getCurrentUser(request);

    const batchPayload = await this.status.markAllRoomsMessagesAsDelivered({
      userId: sub,
    });

    return {
      count: batchPayload.count,
      message: `Marked ${batchPayload.count} messages as delivered.`,
    };
  }

  @Get(':id')
  async getRoom(@Req() request: Request, @Param() param: IdDto): Promise<Room> {
    const { id } = param;
    const { sub } = this.auth.getCurrentUser(request);

    return this.room.checkMembership({
      roomWhereUniqueInput: {
        id,
        users: { some: { id: sub } },
      },
      include: {
        users: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, username: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });
  }

  @Get(':id/messages')
  async getMessages(
    @Param() param: IdDto,
    @Req() request: Request,
    @Query() query: PaginationDto,
  ): Promise<Message[]> {
    const { id } = param;
    const { page, limit } = query;
    const { sub } = this.auth.getCurrentUser(request);

    await this.room.checkMembership({
      roomWhereUniqueInput: { id, users: { some: { id: sub } } },
    });

    const take = limit ? Number(limit) : 20;
    const skip = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    return this.message.messages({
      where: { roomId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, username: true },
        },
        status: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
      take,
      skip,
    });
  }

  @Post(':id/messages/read')
  @HttpCode(200)
  async markMessagesAsRead(
    @Param() param: IdDto,
    @Req() request: Request,
  ): Promise<{ count: number; message: string }> {
    const { id } = param;
    const { sub } = this.auth.getCurrentUser(request);

    await this.room.checkMembership({
      roomWhereUniqueInput: { id, users: { some: { id: sub } } },
    });

    const batchPayload = await this.status.markRoomMessagesAsRead({
      roomId: id,
      userId: sub,
    });

    return {
      count: batchPayload.count,
      message: `Marked ${batchPayload.count} messages as read.`,
    };
  }
}
