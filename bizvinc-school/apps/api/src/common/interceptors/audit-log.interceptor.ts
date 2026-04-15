import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    const mutateMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutateMethods.includes(method) || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          const resource = url.split('/')[3] || 'unknown';
          await this.prisma.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              action: method,
              resource,
              ipAddress: ip,
              userAgent: headers['user-agent'],
            },
          });
        } catch {
          // Do not block response on audit failure
        }
      }),
    );
  }
}
