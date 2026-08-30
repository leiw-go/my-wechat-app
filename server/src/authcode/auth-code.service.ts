import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { generateAuthCode, verifyAuthCode } from './auth-code.generator';
import { AUTH_CODE_INVALID } from '../common/errors';

@Injectable()
export class AuthCodeService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  /**
   * 重发授权码 (走客服通道 / 短信)
   * 限流: 同一订单 5 分钟内最多 1 次
   */
  async resend(params: { userId: bigint; orderId: bigint }) {
    const rateKey = `authcode:resend:${params.orderId}`;
    const limited = await this.redis.set(rateKey, '1', 'NX', 'EX', 300);
    if (!limited) {
      throw new BadRequestException({ code: 3003, message: '5 分钟内已申请过重发, 请稍后' });
    }

    const order = await this.prisma.order.findFirst({
      where: { id: params.orderId },
      include: {
        authCodes: {
          where: { status: 1 },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!order || String(order.userId) !== String(params.userId)) {
      throw new NotFoundException({ code: 4011, message: '订单不存在' });
    }
    if (!['active', 'expiring_soon'].includes(order.status)) {
      throw AUTH_CODE_INVALID('订单未生效, 暂不可重发');
    }
    if (!order.authCodes.length) {
      throw AUTH_CODE_INVALID('授权码不存在');
    }

    const original = order.authCodes[0];

    // 生成 R 类重发码 (不影响主码)
    const resendCode = generateAuthCode('R');

    // 这里实际应调用客服通道 / 短信网关, dev 占位打日志
    // eslint-disable-next-line no-console
    console.log(`[AuthCode resend] user=${params.userId} order=${params.orderId} code=${resendCode}`);

    return {
      order_id: String(params.orderId),
      original_code: original.code,
      resend_code: resendCode,
      resend_at: new Date().toISOString(),
      // 实际: 调客服消息 + 短信
      delivered_via: ['customer_service', 'sms'],
    };
  }
}
