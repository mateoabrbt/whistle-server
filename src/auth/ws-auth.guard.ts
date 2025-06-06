import { Socket } from 'socket.io';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { IS_PUBLIC } from '@auth/auth.decorator';
import { RevokedService } from '@revoked/revoked.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly revoked: RevokedService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromClient(client);

    if (!token) {
      throw new WsException('Missing or malformed token');
    }

    const isRevoked = await this.revoked.revokedToken({ token });
    if (isRevoked) {
      throw new WsException('Token has been revoked');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      client.data = payload;
    } catch {
      throw new WsException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromClient(client: Socket): string | undefined {
    const auth: unknown = client.handshake?.auth?.token;

    if (typeof auth === 'string') return auth;

    const header: unknown = client.handshake?.headers?.authorization;

    if (typeof header !== 'string') return undefined;

    const [type, token] = header.trim().split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
