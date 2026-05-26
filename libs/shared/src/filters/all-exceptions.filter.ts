import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctxType = host.getType();
    if (ctxType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FastifyReply>();
      const request = ctx.getRequest<FastifyRequest>();
      const timestamp = new Date().toISOString();

      const normalized = normalizeHttpLikeException(exception);
      const status = normalized.statusCode;
      const { message, error, details } = normalized;

      const requestId =
        (request.headers['x-request-id'] as string | undefined) ??
        (request.headers['x-correlation-id'] as string | undefined);

      const payload: Record<string, unknown> = {
        statusCode: status,
        error,
        message,
        details,
        timestamp,
        path: request.url,
        method: request.method,
        requestId
      };

      if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
        payload.stack = exception.stack;
      }

      const logMeta = {
        statusCode: status,
        path: request.url,
        method: request.method,
        requestId
      };

      if (status >= 500) {
        this.logger.error(payload.message as string, (exception as Error | undefined)?.stack, logMeta);
      } else {
        this.logger.warn(payload.message as string, logMeta);
      }

      void response.status(status).send(payload);
    } else if (ctxType === 'rpc') {
      // For microservices, rethrowing is usually handled by Nest transport.
      // We still log in a structured way.
      const message =
        exception instanceof RpcException
          ? String(exception.getError())
          : exception instanceof Error
            ? exception.message
            : String(exception);
      this.logger.error(`RPC Error: ${message}`);
    }
  }
}

function normalizeHttpLikeException(exception: unknown): {
  statusCode: number;
  message: string;
  error: string;
  details?: unknown;
} {
  // Gateway often receives RpcException results inside an HTTP request pipeline.
  if (exception instanceof RpcException) {
    const err = exception.getError();
    const extracted = extractRpcError(err) ?? {
      message: typeof err === 'string' ? err : 'Bad request',
      error: 'RpcException',
      details: typeof err === 'object' ? err : undefined
    };
    const statusCode = mapRpcMessageToStatus(extracted.message);
    return {
      statusCode,
      message: extracted.message,
      error: extracted.error,
      details: extracted.details
    };
  }

  if (exception instanceof HttpException) {
    const res = exception.getResponse();
    const statusCode = exception.getStatus();

    // Nest default: { statusCode, message, error }
    if (typeof res === 'object' && res !== null) {
      const obj = res as Record<string, unknown>;
      const messageValue = obj.message;
      const message = Array.isArray(messageValue)
        ? messageValue.join('; ')
        : typeof messageValue === 'string'
          ? messageValue
          : exception.message;

      const error = typeof obj.error === 'string' ? obj.error : exception.name || 'HttpException';

      const { statusCode: _statusCode, message: _message, error: _error, ...rest } = obj;
      const details = Object.keys(rest).length ? rest : undefined;

      // If the HttpException wraps an RPC-like payload, use it to improve the message/status.
      const rpcLike = extractRpcError(details);
      if (rpcLike) {
        const mapped = mapRpcMessageToStatus(rpcLike.message);
        return {
          statusCode: statusCode === 500 ? mapped : statusCode,
          message: statusCode === 500 ? rpcLike.message : message,
          error: statusCode === 500 ? rpcLike.error : error,
          details
        };
      }

      return { statusCode, message, error, details };
    }

    // String response (rare)
    return {
      statusCode,
      message: typeof res === 'string' ? res : exception.message,
      error: exception.name || 'HttpException'
    };
  }

  if (exception instanceof Error) {
    const rpcLike = extractRpcError(exception as unknown);
    if (rpcLike) {
      const statusCode = mapRpcMessageToStatus(rpcLike.message);
      return { statusCode, message: rpcLike.message, error: rpcLike.error, details: rpcLike.details };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
      error: exception.name || 'Error'
    };
  }

  const rpcLike = extractRpcError(exception);
  if (rpcLike) {
    const statusCode = mapRpcMessageToStatus(rpcLike.message);
    return { statusCode, message: rpcLike.message, error: rpcLike.error, details: rpcLike.details };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: 'Error',
    details: exception
  };
}

function extractRpcError(input: unknown): { message: string; error: string; details?: unknown } | null {
  // RpcException.getError() can be a string or an object like { status: 'error', message: '...' }
  if (typeof input === 'string') {
    return { message: input, error: 'RpcException' };
  }

  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    const message = typeof obj.message === 'string' ? obj.message : undefined;
    const status = typeof obj.status === 'string' ? obj.status : undefined;
    if (message && status === 'error') {
      return { message, error: 'RpcException', details: obj };
    }
  }

  return null;
}

function mapRpcMessageToStatus(message: string): number {
  // Small, opinionated mapping for common auth/business errors.
  // Default: 400 (bad request) rather than 500.
  const m = message.toLowerCase();
  if (m.includes('invalid credentials')) return HttpStatus.UNAUTHORIZED;
  if (m.includes('invalid refresh token')) return HttpStatus.UNAUTHORIZED;
  if (m.includes('refresh token reused')) return HttpStatus.UNAUTHORIZED;
  if (m.includes('invalid or expired reset token')) return HttpStatus.BAD_REQUEST;
  if (m.includes('email already exists')) return HttpStatus.CONFLICT;
  if (m.includes('user not found')) return HttpStatus.NOT_FOUND;
  return HttpStatus.BAD_REQUEST;
}
