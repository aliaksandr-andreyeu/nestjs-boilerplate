import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '@gateway/app.module';
import request from 'supertest';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { AuthWsAdapter } from '@gateway/ws-auth.adapter';

const mockEventsClient = {
  send: vi.fn().mockImplementation((pattern) => {
    if (pattern === 'events.create') {
      return of({ id: 'ev1', title: 'E2E Event' });
    }
    if (pattern === 'events.findAll') {
      return of({ data: [], meta: { page: 1, limit: 10, total: 0 } });
    }
    return of({});
  })
};

describe('EventsController (e2e)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('EVENTS_SERVICE')
      .useValue(mockEventsClient)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useWebSocketAdapter(new AuthWsAdapter(app, moduleFixture.get(JwtService)));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    jwtService = app.get(JwtService);
    token = jwtService.sign({ sub: 'user1', email: 'test@test.com' }, { expiresIn: '5m' });
  });

  it('POST /events (с токеном) создаёт событие', () => {
    return request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Event', date: new Date().toISOString() })
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toBe('E2E Event');
      });
  });

  it('POST /events без токена → 403', () => {
    return request(app.getHttpServer()).post('/events').send({}).expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
