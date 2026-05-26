import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '@gateway/app.module';
import { JwtService } from '@nestjs/jwt';
import { AuthWsAdapter } from '@gateway/ws-auth.adapter';
import WebSocket from 'ws';
import { vi } from 'vitest';

const mockEventsClient = { send: vi.fn() };

function openWebSocket(url: string, protocols?: string[]): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, protocols);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

describe('WebSocket Gateway (e2e)', () => {
  let app: NestFastifyApplication;
  let token: string;
  let port: number;

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
    await app.listen(0);
    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Unable to resolve server address for WebSocket tests');
    }
    port = address.port;

    const jwtService = app.get(JwtService);
    token = jwtService.sign({ sub: 'user1', email: 'ws@test.com' }, { expiresIn: '5m' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('должен подключиться с валидным токеном в Sec-WebSocket-Protocol', async () => {
    const ws = await openWebSocket(`ws://127.0.0.1:${port}/ws`, [token]);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('должен отклонить подключение без токена', async () => {
    await expect(openWebSocket(`ws://127.0.0.1:${port}/ws`)).rejects.toThrow(/401/);
  });
});
