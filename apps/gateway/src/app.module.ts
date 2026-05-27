import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from '@gateway/auth.controller';
import { EventsController } from '@gateway/events.controller';
import { EventsGateway } from '@gateway/events.gateway';
import { EventNotificationsController } from '@gateway/event-notifications.controller';
import { HealthController } from '@gateway/health.controller';
import { AppCacheModule, JwtAuthGuard, getNatsServers } from '@shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppCacheModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '5m' }
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.NATS,
        options: { servers: getNatsServers() }
      },
      {
        name: 'EVENTS_SERVICE',
        transport: Transport.NATS,
        options: { servers: getNatsServers() }
      }
    ])
  ],
  controllers: [AuthController, EventsController, EventNotificationsController, HealthController],
  providers: [EventsGateway, JwtAuthGuard]
})
export class AppModule {}
