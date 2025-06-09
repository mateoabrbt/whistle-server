import { Server, Socket } from 'socket.io';
import { Message, MessageStatus, Room } from 'generated/prisma';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  MessageBody,
  WsException,
  ConnectedSocket,
  WebSocketServer,
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
import { StatusService } from '@message/status/status.service';
import { ModifyMessageDto } from './dto/body/modify-message.dto';
import { ReceiveMessageDto } from './dto/body/receive-message.dto';

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
    private readonly status: StatusService,
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
      const { roomId } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      const isUserAlreadyInRoom = await this.room.room({
        roomWhereUniqueInput: {
          id: roomId,
          users: { some: { id: sub } },
        },
      });

      if (isUserAlreadyInRoom) throw new WsException('Already in room');

      const room = await this.room.updateRoom({
        where: { id: roomId },
        data: {
          users: {
            connect: [{ id: sub }],
          },
        },
      });

      void client.join(roomId);
      this.server.to(roomId).emit('userJoinedRoom', { userId: sub, roomId });

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
      const { roomId } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      await this.room.checkMembership({
        exceptionType: 'WsException',
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

      void client.leave(roomId);
      this.server.to(roomId).emit('userLeftRoom', { userId: sub, roomId });

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
      const { roomId, content } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      await this.room.checkMembership({
        exceptionType: 'WsException',
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

      this.server.to(roomId).emit('newMessage', message);

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
      const { roomId, content, messageId } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      const message = await this.message.message({
        id: messageId,
        sender: { id: sub },
      });

      if (!message) {
        throw new WsException('Message not found or you are not the sender');
      }

      const updatedMessage = await this.message.updateMessage({
        where: { id: messageId },
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

  @SubscribeMessage('receiveMessage')
  async handleReceiveMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ReceiveMessageDto,
  ): Promise<MessageStatus> {
    try {
      const { roomId, messageId } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      await this.room.checkMembership({
        exceptionType: 'WsException',
        roomWhereUniqueInput: {
          id: roomId,
          users: { some: { id: sub } },
        },
      });

      const message = await this.message.message({
        id: messageId,
      });

      if (!message) {
        throw new WsException(`Message with ID ${messageId} not found.`);
      }

      const messageStatus = await this.status.createMessageStatus({
        receivedAt: new Date(),
        user: { connect: { id: sub } },
        message: { connect: { id: messageId } },
      });

      this.server.to(roomId).emit('messageReceived', messageStatus);

      return messageStatus;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Receive message error: ${error.message}`,
          error.stack,
        );
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during receiveMessage', error);
        throw new WsException(
          'An unknown error occurred while receiving the message.',
        );
      }
    }
  }
}
