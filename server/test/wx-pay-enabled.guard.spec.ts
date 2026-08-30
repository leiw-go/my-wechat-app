import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WxPayEnabledGuard } from '../src/payment/wx-pay-enabled.guard';

const REQUIRED = ['WX_PAY_MCH_ID', 'WX_APP_ID', 'WX_PAY_API_V3_KEY', 'WX_PAY_NOTIFY_URL'];

function makeContext(): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}), getNext: () => undefined }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

function clearEnv() {
  for (const k of REQUIRED) delete process.env[k];
}
function setEnv(values: Partial<Record<string, string>>) {
  for (const k of REQUIRED) {
    if (values[k] !== undefined) process.env[k] = values[k]!;
    else process.env[k] = 'set';
  }
}

describe('WxPayEnabledGuard (env-controlled 5030)', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('returns true when all WECHAT_PAY_* env are present', () => {
    setEnv({
      WX_PAY_MCH_ID: 'm1',
      WX_APP_ID: 'wx',
      WX_PAY_API_V3_KEY: 'k',
      WX_PAY_NOTIFY_URL: 'https://x',
    });
    const guard = new WxPayEnabledGuard(new Reflector());
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('throws 5030 PAY_DISABLED when any required env is missing', () => {
    clearEnv();
    process.env.WX_PAY_MCH_ID = 'm1';
    process.env.WX_APP_ID = 'wx';
    // WX_PAY_API_V3_KEY / WX_PAY_NOTIFY_URL missing
    const guard = new WxPayEnabledGuard(new Reflector());
    try {
      guard.canActivate(makeContext());
      fail('expected to throw');
    } catch (e: any) {
      const res = e.getResponse();
      expect(res.code).toBe(5030);
      expect(res.message).toBe('支付功能未启用');
      expect(e.getStatus()).toBe(503);
    }
  });

  it('throws 5030 when all required env are missing (cold start)', () => {
    clearEnv();
    const guard = new WxPayEnabledGuard(new Reflector());
    expect(() => guard.canActivate(makeContext())).toThrow(/支付功能未启用/);
  });

  it('throws 5030 when env value is empty string', () => {
    setEnv({ WX_PAY_MCH_ID: '', WX_APP_ID: 'wx', WX_PAY_API_V3_KEY: 'k', WX_PAY_NOTIFY_URL: 'https://x' });
    const guard = new WxPayEnabledGuard(new Reflector());
    expect(() => guard.canActivate(makeContext())).toThrow(/支付功能未启用/);
  });
});