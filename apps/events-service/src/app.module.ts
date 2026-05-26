import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '@events/prisma/prisma.module';
import { EventsController } from '@events/events.controller';
import { EventsService } from '@events/events.service';
import { getNatsServers } from '@shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: { servers: getNatsServers() }
      }
    ])
  ],
  controllers: [EventsController],
  providers: [EventsService]
})
export class AppModule {}
