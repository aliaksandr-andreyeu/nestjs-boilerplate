import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FastifyRequest, FastifyReply } from 'fastify';
import { firstValueFrom } from 'rxjs';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenRpcDto,
  DeleteAccountRpcDto,
  ChangePasswordRpcDto,
  JwtAuthGuard,
  AuthFastifyRequest,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  MessageResponse,
  SuccessResponse
} from '@shared';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    return firstValueFrom(this.authClient.send<RegisterResponse>('auth.register', dto));
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: FastifyReply): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await firstValueFrom(this.authClient.send<LoginResponse>('auth.login', dto));

    res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return { accessToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const payload: RefreshTokenRpcDto = { refreshToken };
    const result = await firstValueFrom(this.authClient.send<RefreshTokenResponse>('auth.refresh', payload));

    res.setCookie('refreshToken', result.newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return { accessToken: result.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Req() req: AuthFastifyRequest): Promise<SuccessResponse> {
    const payload: DeleteAccountRpcDto = { userId: req.user.sub };
    return firstValueFrom(this.authClient.send<SuccessResponse>('auth.deleteAccount', payload));
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponse> {
    return firstValueFrom(this.authClient.send<MessageResponse>('auth.forgotPassword', dto));
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<SuccessResponse> {
    return firstValueFrom(this.authClient.send<SuccessResponse>('auth.resetPassword', dto));
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: AuthFastifyRequest): Promise<SuccessResponse> {
    const payload: ChangePasswordRpcDto = { ...dto, userId: req.user.sub };
    return firstValueFrom(this.authClient.send<SuccessResponse>('auth.changePassword', payload));
  }
}
