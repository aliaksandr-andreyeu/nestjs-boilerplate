import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '@gateway/app.module';
import { AuthWsAdapter } from '@gateway/ws-auth.adapter';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import cookie from '@fastify/cookie';
import { vi } from 'vitest';
import { of } from 'rxjs';

const mockAuthClient = {
  send: vi.fn().mockImplementation((pattern, data) => {
    if (pattern === 'auth.register') {
      return of({ id: 'new-id', email: data.email });
    }
    if (pattern === 'auth.login') {
      return of({ accessToken: 'access', refreshToken: 'refresh' });
    }
    return of({});
  })
};

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('AUTH_SERVICE')
      .useValue(mockAuthClient)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useWebSocketAdapter(new AuthWsAdapter(app, moduleFixture.get(JwtService)));
    await app.init();
    const fastify = app.getHttpAdapter().getInstance();
    await fastify.register(cookie);
    await fastify.ready();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'e2e@test.com', password: '123456' })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe('e2e@test.com');
      });
  });

  it('/auth/login (POST) должен установить refresh cookie', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e@test.com', password: '123456' })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.headers['set-cookie']).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
