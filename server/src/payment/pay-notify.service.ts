import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WxPayService } from './wx-pay.service';
import { PaymentService } from './payment.service';
import { WX_NOTIFY_VERIFY_FAILED } from '../common/errors';

/**
 * 微信支付回调处理
 *
 * 责任:
 * - 验签 (V3 平台证书)
 * - 解密 resource.ciphertext
 * - 幂等 (同一 transaction_id 只处理一次)
 * - 调用 PaymentService.markOrderPaid
 */
@Injectable()
export class PayNotifyService {
  private readonly logger = new Logger(PayNotifyService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly wxPay: WxPayService,
    private readonly payment: PaymentService,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async handleNotify(params: {
    signature: string;
    timestamp: string;
    nonce: string;
    serial: string;
    body: any;
  }) {
    // 幂等: notify_id (body 中的 id) 去重
    const notifyId = params.body?.id;
    if (!notifyId) {
      throw WX_NOTIFY_VERIFY_FAILED('缺少 notify id');
    }

    const seenKey = `wx:notify:${notifyId}`;
    const seen = await this.redis.set(seenKey, '1', 'NX', 'EX', 7 * 86400);
    if (!seen) {
      this.logger.warn(`Duplicate notify: ${notifyId}`);
      return { code: 'SUCCESS', message: '已处理' };
    }

    let decrypted: { out_trade_no: string; transaction_id: string };
    try {
      decrypted = this.wxPay.verifyAndDecryptNotify(params);
    } catch (err) {
      this.logger.error(`Notify verify failed: ${(err as Error).message}`);
      throw WX_NOTIFY_VERIFY_FAILED();
    }

    // 处理订单
    await this.payment.markOrderPaid({
      orderNo: decrypted.out_trade_no,
      wxTransactionId: decrypted.transaction_id,
    });

    return { code: 'SUCCESS', message: '成功' };
  }
}
