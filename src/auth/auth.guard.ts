import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { RevokedService } from '@revoked/revoked.service';

import { IS_PUBLIC } from './auth.public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    @Inject(RevokedService) private revoked: RevokedService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing or malformed Bearer token');
    }

    const isRevoked = await this.revoked.revokedToken({ token });
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  public extractTokenFromHeader(request: Request): string | undefined {
    const auth = request.headers.authorization;

    if (!auth) return undefined;

    const [type, token] = auth.trim().split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
