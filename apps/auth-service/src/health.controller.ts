import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@auth/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { status: 'error', db: 'fail', error: message };
    }
  }
}
