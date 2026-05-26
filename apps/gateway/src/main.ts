import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter, dedupeParams, getNatsServers } from '@shared';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import { AppModule } from '@gateway/app.module';
import { AuthWsAdapter } from '@gateway/ws-auth.adapter';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ logger: true });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.json())
        })
      ]
    })
  });

  const fastify = app.getHttpAdapter().getInstance();

  app.useGlobalFilters(new AllExceptionsFilter());
  await fastify.register(helmet);
  await fastify.register(cors, { origin: true, credentials: true });
  await fastify.register(compress);
  await fastify.register(cookie, { secret: process.env.COOKIE_SECRET });

  fastify.addHook('preValidation', (request, _reply, done) => {
    if (request.query && typeof request.query === 'object' && !Array.isArray(request.query)) {
      dedupeParams(request.query as Record<string, unknown>);
    }

    if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) {
      dedupeParams(request.body as Record<string, unknown>);
    }

    done();
  });

  const config = new DocumentBuilder().setTitle('Events API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const jwtService = app.get(JwtService);
  app.useWebSocketAdapter(new AuthWsAdapter(app, jwtService));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: getNatsServers()
    }
  });
  await app.startAllMicroservices();

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}

void bootstrap();
