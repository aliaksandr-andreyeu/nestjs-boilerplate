import { IsEmail, IsString, IsUUID } from 'class-validator';
import { ChangePasswordDto } from '../auth.dto';

export class RefreshTokenRpcDto {
  @IsString()
  refreshToken!: string;
}

export class DeleteAccountRpcDto {
  @IsUUID()
  userId!: string;
}

export class ForgotPasswordRpcDto {
  @IsEmail()
  email!: string;
}

export class ChangePasswordRpcDto extends ChangePasswordDto {
  @IsUUID()
  userId!: string;
}
