import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Request } from 'express';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Inject } from '@nestjs/common';

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Idempotency-Key 拦截器
 *
 * - 写接口强制要求 Idempotency-Key 头
 * - 同一 key + 同一 endpoint, 24h 内复用首次响应
 * - 跨用户/跨 endpoint 不复用
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: any,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request & { user?: { sub: string } }>();
    if (!IDEMPOTENT_METHODS.has(req.method)) return next.handle();

    const idemKey = req.header('idempotency-key');
    if (!idemKey) {
      throw new BadRequestException({ code: 3001, message: '写接口必须携带 Idempotency-Key 头' });
    }
    if (idemKey.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(idemKey)) {
      throw new BadRequestException({ code: 3001, message: 'Idempotency-Key 格式非法' });
    }

    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const requestHash = createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    // 查 Redis 缓存
    const cacheKey = `idem:${idemKey}:${endpoint}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.requestHash !== requestHash) {
        throw new ConflictException({ code: 3002, message: 'Idempotency-Key 与历史请求冲突' });
      }
      return of(parsed.response);
    }

    // 查 DB (Redis miss)
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { idemKey_endpoint: { idemKey, endpoint } },
    }).catch(() => null);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({ code: 3002, message: 'Idempotency-Key 与历史请求冲突' });
      }
      // 回写 Redis
      await this.redis.setex(cacheKey, 24 * 3600, JSON.stringify({
        requestHash,
        response: existing.response,
      }));
      return of(existing.response);
    }

    // 第一次请求, 执行并缓存
    return next.handle().pipe(
      tap(async (response) => {
        const ttlHours = parseInt(process.env.IDEMPOTENCY_TTL_HOURS || '24', 10);
        const expireAt = new Date(Date.now() + ttlHours * 3600 * 1000);
        await this.prisma.idempotencyKey.create({
          data: {
            idemKey,
            userId: req.user?.sub ? BigInt(req.user.sub) : null,
            endpoint,
            requestHash,
            response: response as any,
            statusCode: 200,
            expireAt,
          },
        }).catch(() => null);
        await this.redis.setex(cacheKey, ttlHours * 3600, JSON.stringify({
          requestHash,
          response,
        }));
      }),
    );
  }
}
