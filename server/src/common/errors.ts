import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常 — 自定义业务错误码 (4xxx / 5xxx)
 */

export class BusinessException extends HttpException {
  constructor(code: number, message: string, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ code, message }, httpStatus);
  }
}

// 4001 商品已下架
export const GOODS_OFFLINE = (msg = '商品已下架') =>
  new BusinessException(4001, msg, HttpStatus.BAD_REQUEST);

// 4002 档位不可用
export const TIER_UNAVAILABLE = (msg = '档位不可用') =>
  new BusinessException(4002, msg, HttpStatus.BAD_REQUEST);

// 4003 订单已支付
export const ORDER_PAID = (msg = '订单已支付') =>
  new BusinessException(4003, msg, HttpStatus.BAD_REQUEST);

// 4004 订单已关闭
export const ORDER_CLOSED = (msg = '订单已关闭') =>
  new BusinessException(4004, msg, HttpStatus.BAD_REQUEST);

// 4005 订单已退款
export const ORDER_REFUNDED = (msg = '订单已退款') =>
  new BusinessException(4005, msg, HttpStatus.BAD_REQUEST);

// 4006 授权码已失效
export const AUTH_CODE_INVALID = (msg = '授权码已失效') =>
  new BusinessException(4006, msg, HttpStatus.BAD_REQUEST);

// 4007 续费不允许(商品已下架)
export const RENEW_NOT_ALLOWED = (msg = '续费不允许(商品已下架)') =>
  new BusinessException(4007, msg, HttpStatus.BAD_REQUEST);

// 5001 微信统一下单失败
export const WX_UNIFIEDORDER_FAILED = (msg = '微信统一下单失败') =>
  new BusinessException(5001, msg, HttpStatus.BAD_GATEWAY);

// 5002 回调验签失败
export const WX_NOTIFY_VERIFY_FAILED = (msg = '回调验签失败') =>
  new BusinessException(5002, msg, HttpStatus.UNAUTHORIZED);

// 5003 回调重复
export const WX_NOTIFY_DUPLICATED = (msg = '回调重复') =>
  new BusinessException(5003, msg, HttpStatus.OK);

// 4010 商品不存在
export const GOODS_NOT_FOUND = (msg = '商品不存在') =>
  new BusinessException(4010, msg, HttpStatus.NOT_FOUND);

// 5030 支付功能未启用 (env-controlled: WECHAT_PAY_* 留空时返)
export const PAY_DISABLED = (msg = '支付功能未启用') =>
  new BusinessException(5030, msg, HttpStatus.SERVICE_UNAVAILABLE);
