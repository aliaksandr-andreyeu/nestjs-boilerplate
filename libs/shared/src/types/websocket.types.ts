import { IncomingMessage } from 'http';
import WebSocket from 'ws';

export interface AuthenticatedIncomingMessage extends IncomingMessage {
  userId: string;
}

export type WsClientWithUser = WebSocket & { userId?: string };
