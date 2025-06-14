import type { Request } from 'express';
import { Message, MessageStatus } from 'generated/prisma';
import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';

import { RoomGateway } from '@room/room.gateway';
import { RoomService } from '@room/room.service';
import { AuthService } from '@auth/auth.service';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/body/send.dto';
import { ReadMessageDto } from './dto/body/read.dto';
import { StatusService } from './status/status.service';
import { DeliveredMessageDto } from './dto/body/delivered.dto';

@Controller('message')
export class MessageController {
  constructor(
    private readonly auth: AuthService,
    private readonly room: RoomService,
    private readonly gateway: RoomGateway,
    private readonly status: StatusService,
    private readonly message: MessageService,
  ) {}

  @Post('send')
  async sendMessage(
    @Req() request: Request,
    @Body() body: SendMessageDto,
  ): Promise<Message> {
    const { roomId, content } = body;
    const { sub } = this.auth.getCurrentUser(request);

    await this.room.checkMembership({
      roomWhereUniqueInput: {
        id: roomId,
        users: { some: { id: sub } },
      },
    });

    const message = await this.message.createMessage({
      data: {
        content,
        room: { connect: { id: roomId } },
        sender: { connect: { id: sub } },
      },
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
    });

    this.gateway.server.to(roomId).emit('newMessage', message);

    return message;
  }

  @Post('delivered')
  @HttpCode(200)
  async deliveredMessage(
    @Req() request: Request,
    @Body() body: DeliveredMessageDto,
  ): Promise<MessageStatus | null> {
    const { roomId, messageId } = body;
    const { sub } = this.auth.getCurrentUser(request);

    await this.room.checkMembership({
      roomWhereUniqueInput: {
        id: roomId,
        users: { some: { id: sub } },
      },
    });

    return this.status.markMessageAsDelivered({
      roomId,
      messageId,
      userId: sub,
    });
  }

  @Post('read')
  @HttpCode(200)
  async readMessage(
    @Req() request: Request,
    @Body() body: ReadMessageDto,
  ): Promise<MessageStatus | null> {
    const { roomId, messageId } = body;
    const { sub } = this.auth.getCurrentUser(request);

    await this.room.checkMembership({
      roomWhereUniqueInput: {
        id: roomId,
        users: { some: { id: sub } },
      },
    });

    return this.status.markMessageAsRead({
      roomId,
      messageId,
      userId: sub,
    });
  }
}
