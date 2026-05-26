import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from '@events/app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { getNatsServers } from '@shared';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.NATS,
    options: { servers: getNatsServers() },
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          /*...*/
        })
      ]
    })
  });
  await app.listen();
}
void bootstrap();
