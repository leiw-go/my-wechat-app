import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './global-exception.filter';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { JwtAuthGuard } from './jwt-auth.guard';
import { WxPayEnabledGuard } from '../payment/wx-pay-enabled.guard';

/**
 * CommonModule 是 @Global() 的横切模块:
 * - 注册全局 ExceptionFilter / ThrottlerGuard / JwtAuthGuard / WxPayEnabledGuard / IdempotencyInterceptor
 * - 注册一次 JwtModule.registerAsync, 让 JwtService 在所有模块中可用
 *   (JwtAuthGuard 在本模块内直接消费, AuthModule 也不再需要单独 imports JwtModule)
 */
@Global()
@Module({
  imports: [
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
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: WxPayEnabledGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  exports: [JwtModule],
})
export class CommonModule {}
