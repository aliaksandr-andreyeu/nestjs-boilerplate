import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@auth/prisma/prisma.module';
import { AuthController } from '@auth/auth.controller';
import { AuthService } from '@auth/auth.service';
import { HealthController } from '@auth/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '5m' }
    }),
    PrismaModule
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthService]
})
export class AppModule {}
