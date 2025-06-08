import { Server, Socket } from 'socket.io';
import { Message, Room } from 'generated/prisma';
import { WebSocketServer, WsException } from '@nestjs/websockets';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';

import { AuthService } from '@auth/auth.service';
import { RoomService } from '@room/room.service';
import { WsAuthGuard } from '@auth/ws-auth.guard';
import { JoinRoomDto } from './dto/body/join-room.dto';
import { LeaveRoomDto } from './dto/body/leave-room.dto';
import { MessageService } from '@message/message.service';
import { SendMessageDto } from './dto/body/send-message.dto';
import { ModifyMessageDto } from './dto/body/modify-message.dto';

@WebSocketGateway({ namespace: 'room', cors: true })
@UseGuards(WsAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
export class RoomGateway {
  constructor(
    private readonly auth: AuthService,
    private readonly room: RoomService,
    private readonly message: MessageService,
  ) {}
  private readonly logger = new Logger(RoomGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('connectToRoom')
  async handleConnectToRoom(
    @ConnectedSocket() client: Socket,
  ): Promise<Room[]> {
    try {
      const { sub } = this.auth.getCurrentSocketUser(client);

      const rooms = await this.room.rooms({
        orderBy: { createdAt: 'desc' },
        where: {
          users: { some: { id: sub } },
        },
      });

      for (const room of rooms) void client.join(room.id);

      return rooms;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Connect error: ${error.message}`, error.stack);
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during connectToRoom', error);
        throw new WsException(
          'An unknown error occurred while connecting to rooms.',
        );
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinRoomDto,
  ): Promise<Room> {
    try {
      const { id } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      const isUserAlreadyInRoom = await this.room.room({
        roomWhereUniqueInput: {
          id,
          users: { some: { id: sub } },
        },
      });

      if (isUserAlreadyInRoom) throw new WsException('Already in room');

      const room = await this.room.updateRoom({
        where: { id },
        data: {
          users: {
            connect: [{ id: sub }],
          },
        },
      });

      void client.join(id);
      this.server.to(id).emit('userJoinedRoom', { userId: sub, roomId: id });

      return room;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Join room error: ${error.message}`, error.stack);
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during joinRoom', error);
        throw new WsException(
          'An unknown error occurred while joining the room.',
        );
      }
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: LeaveRoomDto,
  ): Promise<Room> {
    try {
      const { id } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      await this.room.checkMembership({
        exceptionType: 'WsException',
        roomWhereUniqueInput: {
          id,
          users: { some: { id: sub } },
        },
      });

      const room = await this.room.updateRoom({
        where: { id },
        data: {
          users: {
            disconnect: [{ id: sub }],
          },
        },
      });

      void client.leave(id);
      this.server.to(id).emit('userLeftRoom', { userId: sub, roomId: id });

      return room;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Leave room error: ${error.message}`, error.stack);
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during leaveRoom', error);
        throw new WsException(
          'An unknown error occurred while leaving the room.',
        );
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ): Promise<Message> {
    try {
      const { id, content } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      await this.room.checkMembership({
        exceptionType: 'WsException',
        roomWhereUniqueInput: {
          id,
          users: { some: { id: sub } },
        },
      });

      const message = await this.message.createMessage({
        data: {
          content,
          room: { connect: { id } },
          sender: { connect: { id: sub } },
        },
        include: {
          sender: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      this.server.to(id).emit('newMessage', message);

      return message;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Send message error: ${error.message}`, error.stack);
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during sendMessage', error);
        throw new WsException(
          'An unknown error occurred while sending the message.',
        );
      }
    }
  }

  @SubscribeMessage('modifyMessage')
  async handleModifyMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ModifyMessageDto,
  ): Promise<Message> {
    try {
      const { id, content, roomId } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      const message = await this.message.message({
        id,
        sender: { id: sub },
      });

      if (!message) {
        throw new WsException('Message not found or you are not the sender');
      }

      const updatedMessage = await this.message.updateMessage({
        where: { id },
        data: { content },
      });

      this.server.to(roomId).emit('messageModified', updatedMessage);

      return updatedMessage;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Modify message error: ${error.message}`,
          error.stack,
        );
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during modifyMessage', error);
        throw new WsException(
          'An unknown error occurred while modifying the message.',
        );
      }
    }
  }
}
