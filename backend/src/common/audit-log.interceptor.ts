import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from './prisma.service';
import { Reflector } from '@nestjs/core';

export const AUDIT_LOG_KEY = 'audit_log_resource';
export const AuditLogResource = (resource: string) =>
  SetMetadata(AUDIT_LOG_KEY, resource);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const resource =
      this.reflector.get<string>(AUDIT_LOG_KEY, context.getHandler()) ||
      context.getClass().name.replace(/Controller$/, '');

    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    const action = actionMap[method] || method;

    const userId = request.user?.userId ?? null;
    const userEmail = request.user?.email ?? null;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'] ?? null;

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const resourceId = this.extractResourceId(responseBody, method, request);

        this.prisma.auditLog
          .create({
            data: {
              userId,
              userEmail,
              action,
              resource,
              resourceId,
              ipAddress,
              userAgent,
            },
          })
          .catch((err) =>
            console.error('AuditLog write failed', err),
          );
      }),
    );
  }

  private extractResourceId(
    responseBody: unknown,
    method: string,
    request: Request & { params?: Record<string, string> },
  ): string | null {
    if (responseBody && typeof responseBody === 'object' && 'id' in responseBody) {
      return String((responseBody as Record<string, unknown>).id);
    }

    if (request.params && request.params.id) {
      return request.params.id;
    }

    return null;
  }
}
