import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
}

export type AuthFastifyRequest = FastifyRequest & AuthenticatedRequest;
