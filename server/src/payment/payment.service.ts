import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WxPayService } from './wx-pay.service';
import { OrderStateMachine, ORDER_STATUS } from '../order/order-state-machine';
import { ORDER_PAID, ORDER_CLOSED } from '../common/errors';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly wxPay: WxPayService,
    private readonly stateMachine: OrderStateMachine,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async unifiedorder(params: { userId: bigint; orderId: bigint; openid: string }) {
    const order = await this.prisma.order.findFirst({
      where: { id: params.orderId },
      include: { goods: true, tier: true },
    });
    if (!order || String(order.userId) !== String(params.userId)) {
      throw new NotFoundException({ code: 4011, message: '订单不存在' });
    }
    if (order.status === ORDER_STATUS.PAYING || order.status === ORDER_STATUS.ACTIVE) {
      throw ORDER_PAID();
    }
    if (order.status === ORDER_STATUS.CLOSED) throw ORDER_CLOSED();

    // 切换状态 pending_payment -> paying
    this.stateMachine.assertTransition(
      order.status as any,
      ORDER_STATUS.PAYING,
    );
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.PAYING },
    });

    const jsapiParams = await this.wxPay.jsapiOrder({
      orderNo: order.orderNo,
      priceCent: order.priceCent,
      openid: params.openid,
      description: order.goods.title,
    });

    return {
      order_no: order.orderNo,
      ...jsapiParams,
    };
  }

  async query(params: { userId: bigint; orderNo: string }) {
    const order = await this.prisma.order.findFirst({
      where: { orderNo: params.orderNo },
      select: { orderNo: true, status: true, userId: true },
    });
    if (!order || String(order.userId) !== String(params.userId)) {
      throw new NotFoundException({ code: 4011, message: '订单不存在' });
    }

    // 如果仍是 paying, 主动向微信查单
    if (order.status === ORDER_STATUS.PAYING) {
      try {
        const wx = await this.wxPay.queryOrder(order.orderNo);
        if (wx.trade_state === 'SUCCESS') {
          // 走回调通路处理 (这里直接走幂等处理)
          await this.markOrderPaid({
            orderNo: order.orderNo,
            wxTransactionId: wx.transaction_id!,
          });
          return {
            order_no: order.orderNo,
            status: ORDER_STATUS.ACTIVE,
            paid: true,
            transaction_id: wx.transaction_id,
          };
        }
      } catch {
        // ignore
      }
    }

    return {
      order_no: order.orderNo,
      status: order.status,
      paid: [ORDER_STATUS.ACTIVE, ORDER_STATUS.EXPIRING_SOON, ORDER_STATUS.RENEWING].includes(order.status as any),
    };
  }

  /**
   * 标记订单已支付 (幂等)
   */
  async markOrderPaid(params: { orderNo: string; wxTransactionId: string }) {
    const lockKey = `pay:lock:${params.orderNo}`;
    const locked = await this.redis.set(lockKey, '1', 'NX', 'EX', 60);
    if (!locked) return; // 已在处理中

    try {
      const order = await this.prisma.order.findFirst({
        where: { orderNo: params.orderNo },
        include: { tier: true, user: true },
      });
      if (!order) return;

      // 已支付过 -> 幂等返回
      if (order.wxTransactionId === params.wxTransactionId && order.paidAt) {
        return;
      }

      const now = new Date();
      const expireAt = new Date(now.getTime() + order.tier.durationDays * 86_400_000);
      const isLifetime = order.tier.tierCode === 'L';

      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: ORDER_STATUS.ACTIVE,
            wxTransactionId: params.wxTransactionId,
            paidAt: now,
            expireAt: isLifetime ? new Date('2099-12-31T23:59:59Z') : expireAt,
          },
        });

        // 续费场景: 旧码写 replaced_by + replaced_expire (7 天缓冲)
        if (order.parentOrderId) {
          const oldCode = await tx.authCode.findFirst({
            where: { orderId: order.parentOrderId, status: 1 },
            orderBy: { createdAt: 'desc' },
          });
          if (oldCode) {
            const bufferDays = parseInt(process.env.AUTH_CODE_REPLACE_BUFFER_DAYS || '7', 10);
            await tx.authCode.update({
              where: { id: oldCode.id },
              data: { replacedExpire: new Date(now.getTime() + bufferDays * 86_400_000) },
            });
          }
        }

        // 生成新授权码 (回调通路)
        const { generateAuthCode } = await import('../authcode/auth-code.generator');
        const newCode = generateAuthCode('M');
        await tx.authCode.create({
          data: {
            code: newCode,
            orderId: order.id,
            userId: order.userId,
            goodsId: order.goodsId,
            status: 1,
            expireAt: isLifetime ? new Date('2099-12-31T23:59:59Z') : expireAt,
            replacedBy: null,
            replacedExpire: null,
          },
        });
      });
    } finally {
      await this.redis.del(lockKey);
    }
  }
}
