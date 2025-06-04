import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from 'generated/prisma';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

import { UsersService } from '@users/users.service';
import { RevokedService } from '@revoked/revoked.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly revoked: RevokedService,
  ) {}

  async register(
    data: Prisma.UserCreateInput,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password, username } = data;

    const pepper = process.env.PEPPER_SECRET_KEY;
    if (!pepper) {
      throw new InternalServerErrorException('Internal server error');
    }

    let hashedPassword: string;
    const secret = Buffer.from(pepper);
    try {
      hashedPassword = await argon2.hash(password, { secret });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error hashing password',
        cause: error instanceof Error ? error.message : String(error),
      });
    }

    const user = await this.users.createUser({
      email,
      username,
      password: hashedPassword,
    });

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
    });

    const refresh_token = await this.jwt.signAsync(
      {
        sub: user.id,
      },
      {
        expiresIn: '30d',
        secret: process.env.JWT_REFRESH_SECRET_KEY,
      },
    );

    await this.users.updateUser({
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = data;

    const user = await this.users.user({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pepper = process.env.PEPPER_SECRET_KEY;
    if (!pepper) {
      throw new InternalServerErrorException('Internal server error');
    }

    let isPasswordValid: boolean;
    const secret = Buffer.from(pepper);
    try {
      isPasswordValid = await argon2.verify(user.password, password, {
        secret,
      });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error verifying password',
        cause: error instanceof Error ? error.message : String(error),
      });
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
    });

    const refresh_token = await this.jwt.signAsync(
      {
        sub: user.id,
      },
      {
        expiresIn: '30d',
        secret: process.env.JWT_REFRESH_SECRET_KEY,
      },
    );

    await this.users.updateUser({
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async refresh(data: {
    refresh_token: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { refresh_token } = data;

    let id: string;
    try {
      id = this.jwt.decode<{ sub: string }>(refresh_token)?.sub;

      if (!id || typeof id !== 'string') {
        throw new UnauthorizedException(
          'Invalid user or refresh token information',
        );
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.user({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist`);
    }
    if (!user.refreshToken || user.refreshToken !== refresh_token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      await this.jwt.verifyAsync<JwtPayload>(refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET_KEY,
      });
    } catch {
      await this.users.updateUser({
        where: { id },
        data: { refreshToken: null },
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
    });

    const new_refresh_token = await this.jwt.signAsync(
      {
        sub: user.id,
      },
      {
        expiresIn: '30d',
        secret: process.env.JWT_REFRESH_SECRET_KEY,
      },
    );

    await this.users.updateUser({
      where: { id: user.id },
      data: { refreshToken: new_refresh_token },
    });

    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  async logout(data: {
    id: string;
    token: string;
    expiresAt: string | Date;
  }): Promise<void> {
    const { id, token, expiresAt } = data;

    await this.users.updateUser({
      where: { id },
      data: { refreshToken: null },
    });

    await this.revoked.createRevokedToken({
      token,
      expiresAt,
    });
  }
}
