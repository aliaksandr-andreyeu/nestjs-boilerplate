import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { PasswordResetToken } from '@prisma/app-client';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  ChangePasswordRpcDto,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  MessageResponse,
  SuccessResponse,
  JwtPayload
} from '@shared';
import { PrismaService } from '@auth/prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existing) {
      throw new RpcException('Email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash }
    });
    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new RpcException('Invalid credentials');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '5m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash }
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
    };
  }

  async refreshToken(oldRefreshToken: string): Promise<RefreshTokenResponse> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(oldRefreshToken);
    } catch {
      throw new RpcException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }
    });
    if (!user || !user.refreshTokenHash) {
      throw new RpcException('User not found or no refresh token');
    }

    const isValid = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash);
    if (!isValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null }
      });
      throw new RpcException('Refresh token reused');
    }

    const newPayload: JwtPayload = { sub: user.id, email: user.email };
    const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '5m' });
    const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash }
    });

    return {
      accessToken: newAccessToken,
      newRefreshToken
    };
  }

  async deleteAccount(userId: string): Promise<SuccessResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new RpcException('User not found');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async forgotPassword(email: string): Promise<MessageResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = uuid();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: await bcrypt.hash(resetToken, 10),
        expiresAt: new Date(Date.now() + 3600000)
      }
    });

    this.logger.log(`Password reset token for ${email}: ${resetToken}`);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<SuccessResponse> {
    const resetTokens = await this.prisma.passwordResetToken.findMany({
      where: { expiresAt: { gt: new Date() } }
    });

    let validToken: PasswordResetToken | null = null;
    for (const rt of resetTokens) {
      if (await bcrypt.compare(dto.token, rt.token)) {
        validToken = rt;
        break;
      }
    }

    if (!validToken) {
      throw new RpcException('Invalid or expired reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: validToken.userId },
      data: { passwordHash: newPasswordHash }
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: validToken.id }
    });

    return { success: true };
  }

  async changePassword(dto: ChangePasswordRpcDto): Promise<SuccessResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user || !(await bcrypt.compare(dto.oldPassword, user.passwordHash))) {
      throw new RpcException('Invalid old password');
    }
    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { passwordHash: newHash, refreshTokenHash: null }
    });
    return { success: true };
  }
}
