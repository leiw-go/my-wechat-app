import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAY_DISABLED } from '../common/errors';

/**
 * 支付开关守卫 — 配合 WECHAT_PAY_* env 的全局 guard
 *
 * 行为:
 * - env 留空 (WECHAT_PAY_MCH_ID / WX_APP_ID / WX_PAY_API_V3_KEY / WX_PAY_NOTIFY_URL 任一为空) → 抛 5030
 * - env 就位 → 放行, 进入正常支付链路
 *
 * 跳过:
 * - @SkipPayGuard() 标注的方法可绕过 (用于 /api/pay/notify 回调入口, 由回调本身验签失败兜底)
 */

export const SKIP_PAY_GUARD_KEY = 'skipPayGuard';
export const SkipPayGuard = () => SetMetadata(SKIP_PAY_GUARD_KEY, true);

const REQUIRED_ENV = [
  'WX_PAY_MCH_ID',
  'WX_APP_ID',
  'WX_PAY_API_V3_KEY',
  'WX_PAY_NOTIFY_URL',
];

@Injectable()
export class WxPayEnabledGuard implements CanActivate {
  private readonly logger = new Logger(WxPayEnabledGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PAY_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      this.logger.warn(
        `WECHAT_PAY_* env not configured (missing: ${missing.join(', ')}); returning 5030 to /api/pay/*`,
      );
      throw PAY_DISABLED();
    }
    return true;
  }
}