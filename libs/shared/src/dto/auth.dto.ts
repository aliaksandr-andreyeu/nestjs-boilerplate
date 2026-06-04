import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email', maxLength: 255 })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password (minimum 6, maximum 64 characters)',
    minLength: 6,
    maxLength: 64
  })
  @MinLength(6)
  @IsString()
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email', maxLength: 255 })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password', minLength: 6, maxLength: 64 })
  @IsString()
  password!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  token!: string;

  @ApiProperty({ description: 'New password', minLength: 6, maxLength: 64 })
  @MinLength(6)
  @IsString()
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Old password', minLength: 6, maxLength: 64 })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ description: 'New password', minLength: 6, maxLength: 64 })
  @MinLength(6)
  @IsString()
  newPassword!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email!: string;
}
