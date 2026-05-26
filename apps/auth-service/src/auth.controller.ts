import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  RefreshTokenRpcDto,
  DeleteAccountRpcDto,
  ForgotPasswordRpcDto,
  ChangePasswordRpcDto
} from '@shared';
import { AuthService } from '@auth/auth.service';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern('auth.register')
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern('auth.login')
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern('auth.refresh')
  refresh(@Payload() data: RefreshTokenRpcDto) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @MessagePattern('auth.deleteAccount')
  deleteAccount(@Payload() data: DeleteAccountRpcDto) {
    return this.authService.deleteAccount(data.userId);
  }

  @MessagePattern('auth.forgotPassword')
  forgotPassword(@Payload() data: ForgotPasswordRpcDto) {
    return this.authService.forgotPassword(data.email);
  }

  @MessagePattern('auth.resetPassword')
  resetPassword(@Payload() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @MessagePattern('auth.changePassword')
  changePassword(@Payload() dto: ChangePasswordRpcDto) {
    return this.authService.changePassword(dto);
  }
}
