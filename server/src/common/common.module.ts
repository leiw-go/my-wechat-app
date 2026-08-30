import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './global-exception.filter';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { JwtAuthGuard } from './jwt-auth.guard';
import { WxPayEnabledGuard } from '../payment/wx-pay-enabled.guard';

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: WxPayEnabledGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  exports: [],
})
export class CommonModule {}
