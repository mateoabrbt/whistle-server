import { Injectable } from '@nestjs/common';
import { MessageStatus, Prisma } from 'generated/prisma';

import { RoomGateway } from '@room/room.gateway';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class StatusService {
  constructor(
    private readonly gateway: RoomGateway,
    private readonly prisma: PrismaService,
  ) {}

  async markMessageAsDelivered(params: {
    roomId: string;
    userId: string;
    messageId: string;
  }): Promise<MessageStatus | null> {
    const { roomId, userId, messageId } = params;

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findUnique({
        where: { id: messageId },
        select: { senderId: true },
      });

      if (message && message.senderId === userId) {
        return tx.messageStatus.findUnique({
          where: {
            userId_messageId: { userId, messageId },
          },
        });
      }

      const existingStatus = await tx.messageStatus.findUnique({
        where: {
          userId_messageId: {
            userId,
            messageId,
          },
        },
      });

      if (!existingStatus) {
        const newStatus = await tx.messageStatus.create({
          data: {
            deliveredAt: new Date(),
            user: { connect: { id: userId } },
            message: { connect: { id: messageId } },
          },
        });

        this.gateway.server.to(roomId).emit('messageDelivered', newStatus);
        return newStatus;
      } else if (!existingStatus.readAt && !existingStatus.deliveredAt) {
        const updatedStatus = await tx.messageStatus.update({
          where: {
            userId_messageId: {
              userId,
              messageId,
            },
          },
          data: { deliveredAt: new Date() },
        });

        this.gateway.server.to(roomId).emit('messageDelivered', updatedStatus);
        return updatedStatus;
      } else {
        return existingStatus;
      }
    });
  }

  async markMessageAsRead(params: {
    roomId: string;
    userId: string;
    messageId: string;
  }): Promise<MessageStatus | null> {
    const { roomId, userId, messageId } = params;

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findUnique({
        where: { id: messageId },
        select: { senderId: true },
      });

      if (message && message.senderId === userId) {
        return tx.messageStatus.findUnique({
          where: {
            userId_messageId: { userId, messageId },
          },
        });
      }

      const existingStatus = await tx.messageStatus.findUnique({
        where: {
          userId_messageId: {
            userId,
            messageId,
          },
        },
      });

      if (!existingStatus) {
        const newStatus = await tx.messageStatus.create({
          data: {
            readAt: new Date(),
            deliveredAt: new Date(),
            user: { connect: { id: userId } },
            message: { connect: { id: messageId } },
          },
        });

        this.gateway.server.to(roomId).emit('messageRead', newStatus);
        return newStatus;
      } else if (!existingStatus.readAt) {
        const updatedStatus = await tx.messageStatus.update({
          where: {
            userId_messageId: {
              userId,
              messageId,
            },
          },
          data: {
            readAt: new Date(),
            deliveredAt: existingStatus.deliveredAt || new Date(),
          },
        });

        this.gateway.server.to(roomId).emit('messageRead', updatedStatus);
        return updatedStatus;
      } else {
        return existingStatus;
      }
    });
  }

  async markAllRoomsMessagesAsDelivered(params: {
    userId: string;
  }): Promise<Prisma.BatchPayload> {
    const { userId } = params;

    return this.prisma.$transaction(async (tx) => {
      const batchPayload = { count: 0 };
      const rooms = await tx.room.findMany({
        where: { users: { some: { id: userId } } },
        select: { id: true },
      });

      if (rooms.length === 0) return batchPayload;

      for (const room of rooms) {
        const messages = await tx.message.findMany({
          where: {
            roomId: room.id,
            senderId: { not: userId },
            status: {
              none: {
                userId,
                deliveredAt: { not: null },
              },
            },
          },
          select: { id: true },
        });

        if (messages.length === 0) continue;

        const messageIds = messages.map((msg) => msg.id);

        const updateResult = await tx.messageStatus.updateMany({
          where: {
            userId,
            deliveredAt: null,
            messageId: { in: messageIds },
          },
          data: {
            deliveredAt: new Date(),
          },
        });

        const createResult = await tx.messageStatus.createMany({
          data: messageIds.map((id) => ({
            userId,
            messageId: id,
            deliveredAt: new Date(),
          })),
          skipDuplicates: true,
        });

        const currentRoomAffectedCount =
          updateResult.count + createResult.count;

        batchPayload.count += currentRoomAffectedCount;

        if (currentRoomAffectedCount > 0) {
          const statuses = await tx.messageStatus.findMany({
            where: {
              userId,
              messageId: { in: messageIds },
            },
          });

          if (statuses.length > 0) {
            this.gateway.server.to(room.id).emit('messagesDelivered', statuses);
          }
        }
      }

      return batchPayload;
    });
  }

  async markRoomMessagesAsRead(params: {
    userId: string;
    roomId: string;
  }): Promise<Prisma.BatchPayload> {
    const { userId, roomId } = params;

    return this.prisma.$transaction(async (tx) => {
      const messages = await tx.message.findMany({
        where: {
          roomId,
          senderId: { not: userId },
          status: {
            none: {
              userId,
              readAt: { not: null },
            },
          },
        },
        select: { id: true },
      });

      if (messages.length === 0) return { count: 0 };

      const messageIds = messages.map((msg) => msg.id);

      const updateResult = await tx.messageStatus.updateMany({
        where: {
          userId,
          readAt: null,
          messageId: { in: messageIds },
        },
        data: {
          readAt: new Date(),
          deliveredAt: new Date(),
        },
      });

      const createResult = await tx.messageStatus.createMany({
        data: messageIds.map((id) => ({
          userId,
          messageId: id,
          readAt: new Date(),
          deliveredAt: new Date(),
        })),
        skipDuplicates: true,
      });

      const totalAffectedCount = updateResult.count + createResult.count;

      if (totalAffectedCount > 0) {
        const statuses = await tx.messageStatus.findMany({
          where: {
            userId,
            messageId: { in: messageIds },
          },
        });

        if (statuses.length > 0) {
          this.gateway.server.to(roomId).emit('messagesRead', statuses);
        }
      }

      return { count: totalAffectedCount };
    });
  }
}
