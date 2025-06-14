import { Room } from 'generated/prisma';
import { Server, Socket } from 'socket.io';
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
import { JoinRoomDto } from './dto/body/join.dto';

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

  @SubscribeMessage('connectToAllRooms')
  async connectToAllRooms(@ConnectedSocket() client: Socket): Promise<Room[]> {
    try {
      const { sub } = this.auth.getCurrentSocketUser(client);

      const rooms = await this.room.rooms({
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
        this.logger.error('Unknown error during connectToAllRooms', error);
        throw new WsException(
          'An unknown error occurred while connecting to rooms.',
        );
      }
    }
  }

  @SubscribeMessage('connectToRoom')
  async handleConnectToRoom(
    @MessageBody() body: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<Room> {
    try {
      const { roomId } = body;
      const { sub } = this.auth.getCurrentSocketUser(client);

      const room = await this.room.checkMembership({
        roomWhereUniqueInput: {
          id: roomId,
          users: { some: { id: sub } },
        },
      });

      void client.join(room.id);

      return room;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Connect error: ${error.message}`, error.stack);
        throw new WsException(error.message);
      } else {
        this.logger.error('Unknown error during connectToRoom', error);
        throw new WsException(
          `An unknown error occurred while connecting to room ${body.roomId}.`,
        );
      }
    }
  }
}
