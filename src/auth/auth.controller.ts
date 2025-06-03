import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import {
  Req,
  Post,
  Body,
  HttpCode,
  Controller,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@auth/auth.guard';
import { LoginDto } from '@auth/dto/login.dto';
import { AuthService } from '@auth/auth.service';
import { SignupDto } from '@auth/dto/signup.dto';
import { RefreshDto } from '@auth/dto/refresh.dto';
import { Public } from '@auth/auth.public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwt: JwtService,
    private readonly guard: AuthGuard,
    private readonly auth: AuthService,
  ) {}

  @Public()
  @Post('register')
  register(
    @Body() body: SignupDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  login(
    @Body() body: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.auth.login(body);
  }

  @Public()
  @Post('refresh')
  refresh(
    @Body() body: RefreshDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { refresh_token } = body;

    try {
      const id = this.jwt.decode<{ sub: string }>(refresh_token)?.sub;

      if (!id || typeof id !== 'string') {
        throw new UnauthorizedException(
          'Invalid user or refresh token information',
        );
      }

      return this.auth.refresh({
        id,
        refresh_token,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() request: Request): Promise<void> {
    const user = request['user'] as JwtPayload;
    const token = this.guard.extractTokenFromHeader(request) as string;

    if (!user || typeof user.sub !== 'string' || typeof user.exp !== 'number') {
      throw new UnauthorizedException('Invalid user or token information');
    }

    const expiresAt = new Date(user.exp * 1000);

    return this.auth.logout({
      token,
      expiresAt,
      id: user.sub,
    });
  }
}
