import 'fastify';
import type { JwtPayload } from './jwt.types';

declare module 'fastify' {
  interface FastifyRequest {
    // We intentionally keep this minimal: services attach `request.user` after JWT validation.
    user?: JwtPayload;
  }
}
