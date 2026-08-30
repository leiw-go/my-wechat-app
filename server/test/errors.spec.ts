import {
  GOODS_OFFLINE,
  TIER_UNAVAILABLE,
  ORDER_PAID,
  ORDER_CLOSED,
  ORDER_REFUNDED,
  AUTH_CODE_INVALID,
  RENEW_NOT_ALLOWED,
  WX_UNIFIEDORDER_FAILED,
  WX_NOTIFY_VERIFY_FAILED,
  WX_NOTIFY_DUPLICATED,
  GOODS_NOT_FOUND,
  PAY_DISABLED,
} from '../src/common/errors';

describe('business error codes (PRD §8 US-*, C4 §6.2)', () => {
  it('GOODS_OFFLINE → 4001', () => {
    const e = GOODS_OFFLINE();
    expect((e.getResponse() as any).code).toBe(4001);
    expect(e.getStatus()).toBe(400);
  });

  it('TIER_UNAVAILABLE → 4002', () => {
    const e = TIER_UNAVAILABLE();
    expect((e.getResponse() as any).code).toBe(4002);
  });

  it('ORDER_PAID → 4003', () => {
    const e = ORDER_PAID();
    expect((e.getResponse() as any).code).toBe(4003);
  });

  it('ORDER_CLOSED → 4004', () => {
    const e = ORDER_CLOSED();
    expect((e.getResponse() as any).code).toBe(4004);
  });

  it('ORDER_REFUNDED → 4005', () => {
    const e = ORDER_REFUNDED();
    expect((e.getResponse() as any).code).toBe(4005);
  });

  it('AUTH_CODE_INVALID → 4006', () => {
    const e = AUTH_CODE_INVALID();
    expect((e.getResponse() as any).code).toBe(4006);
  });

  it('RENEW_NOT_ALLOWED → 4007', () => {
    const e = RENEW_NOT_ALLOWED();
    expect((e.getResponse() as any).code).toBe(4007);
  });

  it('WX_UNIFIEDORDER_FAILED → 5001', () => {
    const e = WX_UNIFIEDORDER_FAILED();
    expect((e.getResponse() as any).code).toBe(5001);
  });

  it('WX_NOTIFY_VERIFY_FAILED → 5002', () => {
    const e = WX_NOTIFY_VERIFY_FAILED();
    expect((e.getResponse() as any).code).toBe(5002);
  });

  it('WX_NOTIFY_DUPLICATED → 5003', () => {
    const e = WX_NOTIFY_DUPLICATED();
    expect((e.getResponse() as any).code).toBe(5003);
  });

  it('GOODS_NOT_FOUND → 4010', () => {
    const e = GOODS_NOT_FOUND();
    expect((e.getResponse() as any).code).toBe(4010);
  });

  it('PAY_DISABLED → 5030', () => {
    const e = PAY_DISABLED();
    expect((e.getResponse() as any).code).toBe(5030);
    expect((e.getResponse() as any).message).toBe('支付功能未启用');
    expect(e.getStatus()).toBe(503);
  });

  it('all error messages should be developer-friendly, not leak internals', () => {
    const errors = [
      GOODS_OFFLINE(),
      TIER_UNAVAILABLE(),
      ORDER_PAID(),
      WX_UNIFIEDORDER_FAILED(),
    ];
    errors.forEach((e) => {
      const res = e.getResponse() as any;
      expect(res.message).not.toContain('Error:');
      expect(res.message).not.toContain('ENOENT');
      expect(res.message).not.toContain('at Object.');
    });
  });
});
