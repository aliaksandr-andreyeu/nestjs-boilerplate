import { WsAdapter } from '@nestjs/platform-ws';
import { INestApplicationContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServerOptions, WebSocketServer } from 'ws';
import { JwtPayload, AuthenticatedIncomingMessage } from '@shared';

export class AuthWsAdapter extends WsAdapter {
  constructor(
    app: INestApplicationContext,
    private jwtService: JwtService
  ) {
    super(app);
  }

  create(port: number, options?: ServerOptions): WebSocketServer {
    const server = super.create(port, {
      ...options,
      verifyClient: (
        info: { req: AuthenticatedIncomingMessage; origin: string },
        cb: (res: boolean, code?: number, message?: string) => void
      ) => {
        const protocols = info.req.headers['sec-websocket-protocol'];
        const token = Array.isArray(protocols) ? protocols[0] : protocols?.split(',')[0]?.trim();

        if (!token) {
          cb(false, 401, 'Unauthorized');
          return;
        }

        try {
          const payload = this.jwtService.verify<JwtPayload>(token);
          info.req.userId = payload.sub;
          cb(true);
        } catch {
          cb(false, 403, 'Forbidden');
        }
      }
    }) as WebSocketServer;
    return server;
  }
}
