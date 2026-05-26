import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя', maxLength: 255 })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль (минимум 6, максимум 64 символа)',
    minLength: 6,
    maxLength: 64
  })
  @MinLength(6)
  @IsString()
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя', maxLength: 255 })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Пароль', minLength: 6, maxLength: 64 })
  @IsString()
  password!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Токен сброса пароля' })
  @IsString()
  token!: string;

  @ApiProperty({ description: 'Новый пароль', minLength: 6, maxLength: 64 })
  @MinLength(6)
  @IsString()
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Старый пароль', minLength: 6, maxLength: 64 })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ description: 'Новый пароль', minLength: 6, maxLength: 64 })
  @MinLength(6)
  @IsString()
  newPassword!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail()
  email!: string;
}
