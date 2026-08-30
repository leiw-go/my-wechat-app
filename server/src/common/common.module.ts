import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { GlobalExceptionFilter } from './global-exception.filter';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { HealthController } from './health.controller';

/**
 * CommonModule 是 @Global() 的横切模块:
 * - 注册全局 ExceptionFilter / ThrottlerGuard / IdempotencyInterceptor
 * - 注册一次 JwtModule.registerAsync, 让 JwtService 在所有模块中可用
 *   (JwtAuthGuard 在本模块内直接消费, AuthModule 也不再需要单独 imports JwtModule)
 *
 * 设计说明:
 * - JwtAuthGuard 不再注册为 APP_GUARD, 改为各 controller 通过 @UseGuards(JwtAuthGuard)
 *   显式声明。这样 PaymentController 可以用
 *   `@UseGuards(WxPayEnabledGuard, JwtAuthGuard)` 让 WxPayEnabledGuard 先于
 *   JwtAuthGuard 执行, 5030 自证时不被 401 拦截。
 * - WxPayEnabledGuard 不再注册为 APP_GUARD, 仅在 PaymentController 范围内触发,
 *   避免 /api/category/list / /api/goods/list 等非支付路由被误判 5030。
 * - PrismaModule / RedisModule 已 @Global(), 这里 explicit imports 只是让模块装载
 *   顺序更可读 + 防止后续移除 @Global() 时漏改。
 */
@Global()
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET,
        signOptions: {
          expiresIn: parseInt(process.env.JWT_ACCESS_TTL || '7200', 10),
        },
      }),
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  controllers: [HealthController],
  exports: [JwtModule],
})
export class CommonModule {}
