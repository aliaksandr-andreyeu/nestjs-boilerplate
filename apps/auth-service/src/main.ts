import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from '@auth/app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AllExceptionsFilter, getNatsServers } from '@shared';

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
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen();
}
void bootstrap();
