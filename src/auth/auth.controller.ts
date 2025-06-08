import { Request } from 'express';
import {
  Req,
  Post,
  Body,
  HttpCode,
  Controller,
  UnauthorizedException,
} from '@nestjs/common';

import { LoginDto } from '@auth/dto/login.dto';
import { AuthService } from '@auth/auth.service';
import { SignupDto } from '@auth/dto/signup.dto';
import { RefreshDto } from '@auth/dto/refresh.dto';
import { AuthGuard } from '@auth/auth.guard';
import { Public } from '@auth/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly guard: AuthGuard,
    private readonly auth: AuthService,
  ) {}

  @Public()
  @Post('register')
  register(
    @Body() body: SignupDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body() body: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.login(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body() body: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.refresh(body);
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
