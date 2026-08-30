import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { OrderStateMachine, ORDER_STATUS } from './order-state-machine';
import { CreateOrderDto, RenewOrderDto } from './dto';
import { GOODS_OFFLINE, TIER_UNAVAILABLE, ORDER_CLOSED, RENEW_NOT_ALLOWED } from '../common/errors';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stateMachine: OrderStateMachine,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async create(userId: bigint, userType: number, dto: CreateOrderDto) {
    const [goods, tier] = await Promise.all([
      this.prisma.goods.findUnique({ where: { id: BigInt(dto.goods_id) } }),
      this.prisma.goodsTier.findUnique({ where: { id: BigInt(dto.tier_id) } }),
    ]);

    if (!goods) throw new NotFoundException({ code: 4010, message: '商品不存在' });
    if (goods.status !== 1) throw GOODS_OFFLINE();
    if (!tier || String(tier.goodsId) !== String(goods.id)) throw TIER_UNAVAILABLE();
    if (tier.status !== 1) throw TIER_UNAVAILABLE();

    const orderNo = this.generateOrderNo();

    const order = await this.prisma.order.create({
      data: {
        orderNo,
        userId,
        userType,
        goodsId: goods.id,
        tierId: tier.id,
        priceCent: tier.priceCent,
        status: ORDER_STATUS.PENDING_PAYMENT,
      },
    });

    return {
      id: String(order.id),
      order_no: order.orderNo,
      price_cent: order.priceCent,
      status: order.status,
      goods_id: String(goods.id),
      tier_id: String(tier.id),
      tier_name: tier.tierName,
      created_at: order.createdAt.toISOString(),
    };
  }

  async list(params: { userId: bigint; tab: string; page: number; pageSize: number }) {
    const { userId, tab, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (tab === 'active') where.status = { in: [ORDER_STATUS.ACTIVE, ORDER_STATUS.EXPIRING_SOON] };
    else if (tab === 'expired') where.status = ORDER_STATUS.EXPIRED;

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          goods: { select: { title: true, coverImg: true } },
          tier: { select: { tierName: true } },
          authCodes: {
            where: { status: 1 },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { code: true },
          },
        },
      }),
    ]);

    const now = Date.now();
    return {
      total,
      items: items.map((o) => ({
        id: String(o.id),
        order_no: o.orderNo,
        price_cent: o.priceCent,
        status: o.status,
        expire_at: o.expireAt?.toISOString() || null,
        created_at: o.createdAt.toISOString(),
        goods_title: o.goods.title,
        goods_cover_img: o.goods.coverImg,
        tier_name: o.tier.tierName,
        expiring_soon: o.expireAt ? (o.expireAt.getTime() - now) / 86_400_000 <= 7 : false,
        auth_code: o.authCodes[0]?.code || null,
      })),
    };
  }

  async detail(userId: bigint, orderNo: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNo },
      include: {
        goods: { select: { id: true, title: true, coverImg: true, ipProofUrl: true } },
        tier: { select: { id: true, tierCode: true, tierName: true, priceCent: true, durationDays: true } },
        authCodes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { code: true, status: true, expireAt: true, replacedBy: true },
        },
      },
    });
    if (!order || String(order.userId) !== String(userId)) {
      throw new NotFoundException({ code: 4011, message: '订单不存在' });
    }
    return {
      id: String(order.id),
      order_no: order.orderNo,
      status: order.status,
      price_cent: order.priceCent,
      wx_transaction_id: order.wxTransactionId,
      paid_at: order.paidAt?.toISOString() || null,
      expire_at: order.expireAt?.toISOString() || null,
      created_at: order.createdAt.toISOString(),
      parent_order_id: order.parentOrderId ? String(order.parentOrderId) : null,
      goods: {
        id: String(order.goods.id),
        title: order.goods.title,
        cover_img: order.goods.coverImg,
        ip_proof_url: order.goods.ipProofUrl,
      },
      tier: {
        id: String(order.tier.id),
        tier_code: order.tier.tierCode,
        tier_name: order.tier.tierName,
        price_cent: order.tier.priceCent,
        duration_days: order.tier.durationDays,
      },
      auth_code: order.authCodes[0]?.code || null,
      auth_code_status: order.authCodes[0]?.status ?? null,
      auth_code_expire_at: order.authCodes[0]?.expireAt?.toISOString() || null,
      replaced_by: order.authCodes[0]?.replacedBy ? String(order.authCodes[0].replacedBy) : null,
    };
  }

  async status(userId: bigint, orderNo: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNo },
      select: { orderNo: true, status: true, userId: true },
    });
    if (!order || String(order.userId) !== String(userId)) {
      throw new NotFoundException({ code: 4011, message: '订单不存在' });
    }
    return {
      order_no: order.orderNo,
      status: order.status,
      paid: ['active', 'expiring_soon', 'renewing'].includes(order.status),
    };
  }

  async renew(userId: bigint, userType: number, dto: RenewOrderDto) {
    const parent = await this.prisma.order.findFirst({
      where: { id: BigInt(dto.parent_order_id) },
      include: { goods: true, tier: true },
    });
    if (!parent || String(parent.userId) !== String(userId)) {
      throw new NotFoundException({ code: 4011, message: '原订单不存在' });
    }
    if (parent.status === ORDER_STATUS.CLOSED || parent.status === ORDER_STATUS.REFUNDED) {
      throw ORDER_CLOSED();
    }
    // 商品下架禁止续费
    if (parent.goods.status !== 1) throw RENEW_NOT_ALLOWED();

    const tier = dto.tier_id
      ? await this.prisma.goodsTier.findUnique({ where: { id: BigInt(dto.tier_id) } })
      : parent.tier;

    if (!tier) throw TIER_UNAVAILABLE();

    const orderNo = this.generateOrderNo();
    const order = await this.prisma.order.create({
      data: {
        orderNo,
        userId,
        userType,
        goodsId: parent.goodsId,
        tierId: tier.id,
        priceCent: tier.priceCent,
        status: ORDER_STATUS.PENDING_PAYMENT,
        parentOrderId: parent.id,
      },
    });

    return {
      id: String(order.id),
      order_no: order.orderNo,
      price_cent: order.priceCent,
      status: order.status,
      parent_order_id: String(parent.id),
      created_at: order.createdAt.toISOString(),
    };
  }

  /** 业务订单号: yyyyMMddHHmmss + 6 位随机 */
  private generateOrderNo(): string {
    const ts = new Date();
    const pad = (n: number, l = 2) => String(n).padStart(l, '0');
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
    const rand = randomBytes(3).toString('hex').toUpperCase();
    return `${stamp}${rand}`;
  }
}
