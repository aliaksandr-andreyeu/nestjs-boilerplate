import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import WebSocket, { Server } from 'ws';
import { Logger } from '@nestjs/common';
import { EventPayload, AuthenticatedIncomingMessage, WsClientWithUser } from '@shared';

@WebSocketGateway({ path: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private clients = new Map<string, Set<WsClientWithUser>>();

  handleConnection(client: WsClientWithUser, req: AuthenticatedIncomingMessage): void {
    const userId = req.userId;
    if (!userId) {
      client.close(4001, 'Unauthorized');
      return;
    }

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(client);
    client.userId = userId;

    this.logger.log(`User ${userId} connected via WebSocket`);
  }

  handleDisconnect(client: WsClientWithUser): void {
    const userId = client.userId;
    if (userId && this.clients.has(userId)) {
      this.clients.get(userId)!.delete(client);
      if (this.clients.get(userId)!.size === 0) {
        this.clients.delete(userId);
      }
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  notifyAll(event: EventPayload): void {
    const message = JSON.stringify({ type: 'event.created', payload: event });
    this.clients.forEach((sockets) => {
      sockets.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      });
    });
  }
}
