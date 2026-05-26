import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthFastifyRequest, JwtPayload } from '../types/jwt.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthFastifyRequest>();
    const authHeader = request.headers.authorization;
    if (!authHeader) return false;
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return false;
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
