import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { WxPayService } from '../payment/wx-pay.service';
import { PaymentService } from '../payment/payment.service';
import { ORDER_STATUS } from '../order/order-state-machine';

/**
 * 定时任务:
 * - 每分钟: 30min 未收到回调的 paying 订单 → 主动查单 → 失败则关闭
 * - 每天 03:00: 过期授权码清理 (7 天 replaced_expire 到期)
 * - 每天 04:00: 即将到期订单提醒 (距到期 ≤ 7 天 → expiring_soon)
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly wxPay: WxPayService,
    private readonly payment: PaymentService,
  ) {}

  /** 每分钟: 处理超时 paying 订单 */
  @Cron(CronExpression.EVERY_MINUTE)
  async handlePayingTimeout() {
    const start = Date.now();
    const timeoutMinutes = parseInt(process.env.ORDER_PAY_TIMEOUT_MINUTES || '30', 10);
    const threshold = new Date(Date.now() - timeoutMinutes * 60_000);

    const orders = await this.prisma.order.findMany({
      where: {
        status: ORDER_STATUS.PAYING,
        createdAt: { lt: threshold },
      },
      take: 50,
    });

    let affected = 0;
    for (const order of orders) {
      try {
        const wx = await this.wxPay.queryOrder(order.orderNo);
        if (wx.trade_state === 'SUCCESS') {
          await this.payment.markOrderPaid({
            orderNo: order.orderNo,
            wxTransactionId: wx.transaction_id!,
          });
          affected++;
        } else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(wx.trade_state)) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: ORDER_STATUS.CLOSED },
          });
          affected++;
        }
      } catch (err) {
        this.logger.warn(`Paying-timeout query fail order=${order.orderNo}: ${(err as Error).message}`);
      }
    }

    await this.prisma.cronJobLog.create({
      data: {
        jobName: 'paying-timeout',
        affected,
        durationMs: Date.now() - start,
      },
    });
  }

  /** 每天 03:00: 清理过期 replaced auth_code */
  @Cron('0 0 3 * * *')
  async handleAuthCodeBufferExpire() {
    const start = Date.now();
    const result = await this.prisma.authCode.updateMany({
      where: {
        status: 1,
        replacedExpire: { lt: new Date() },
      },
      data: { status: 0 },
    });
    await this.prisma.cronJobLog.create({
      data: {
        jobName: 'authcode-buffer-expire',
        affected: result.count,
        durationMs: Date.now() - start,
      },
    });
    this.logger.log(`Auth code buffer expired: ${result.count} codes marked invalid`);
  }

  /** 每天 04:00: active → expiring_soon (距到期 ≤ 7 天) */
  @Cron('0 0 4 * * *')
  async handleExpiringSoon() {
    const start = Date.now();
    const sevenDays = new Date(Date.now() + 7 * 86_400_000);
    const result = await this.prisma.order.updateMany({
      where: {
        status: ORDER_STATUS.ACTIVE,
        expireAt: { lte: sevenDays, gte: new Date() },
      },
      data: { status: ORDER_STATUS.EXPIRING_SOON },
    });
    await this.prisma.cronJobLog.create({
      data: {
        jobName: 'order-expiring-soon',
        affected: result.count,
        durationMs: Date.now() - start,
      },
    });
    this.logger.log(`Orders marked expiring_soon: ${result.count}`);
  }

  /** 每天 04:30: 过期订单 active/expiring_soon → expired */
  @Cron('0 30 4 * * *')
  async handleExpiredOrders() {
    const start = Date.now();
    const result = await this.prisma.order.updateMany({
      where: {
        status: { in: [ORDER_STATUS.ACTIVE, ORDER_STATUS.EXPIRING_SOON] },
        expireAt: { lt: new Date() },
      },
      data: { status: ORDER_STATUS.EXPIRED },
    });
    await this.prisma.cronJobLog.create({
      data: {
        jobName: 'order-expired',
        affected: result.count,
        durationMs: Date.now() - start,
      },
    });
    this.logger.log(`Orders marked expired: ${result.count}`);
  }

  /** 每天 05:00: 关闭 15 分钟未支付的 pending_payment 订单 */
  @Cron('0 0 5 * * *')
  async handlePendingPaymentTimeout() {
    const start = Date.now();
    const threshold = new Date(Date.now() - 15 * 60_000);
    const result = await this.prisma.order.updateMany({
      where: {
        status: ORDER_STATUS.PENDING_PAYMENT,
        createdAt: { lt: threshold },
      },
      data: { status: ORDER_STATUS.CLOSED },
    });
    await this.prisma.cronJobLog.create({
      data: {
        jobName: 'pending-payment-timeout',
        affected: result.count,
        durationMs: Date.now() - start,
      },
    });
    this.logger.log(`Pending orders closed: ${result.count}`);
  }

  /** 每小时: 清理过期 idempotency_key */
  @Cron(CronExpression.EVERY_HOUR)
  async handleIdempotencyKeyExpire() {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: { expireAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`Idempotency keys cleaned: ${result.count}`);
    }
  }
}
