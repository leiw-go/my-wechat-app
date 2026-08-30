import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class GoodsService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async list(params: { categoryId?: number; keyword?: string; page: number; pageSize: number }) {
    const { categoryId, keyword, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    // Redis 缓存(60s)
    const cacheKey = `goods:list:${categoryId || ''}:${keyword || ''}:${page}:${pageSize}`;
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const where: any = { status: 1 };
    if (categoryId) where.categoryId = BigInt(categoryId);
    if (keyword) where.title = { contains: keyword };

    const [total, items] = await Promise.all([
      this.prisma.goods.count({ where }),
      this.prisma.goods.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          tiers: {
            where: { status: 1 },
            orderBy: { sort: 'asc' },
            select: { id: true, tierCode: true, priceCent: true, durationDays: true },
          },
        },
      }),
    ]);

    const result = {
      total,
      page,
      page_size: pageSize,
      items: items.map((g) => ({
        id: String(g.id),
        title: g.title,
        subtitle: g.subtitle,
        cover_img: g.coverImg,
        status: g.status,
        price_from_cent: g.tiers.length > 0 ? Math.min(...g.tiers.map((t) => t.priceCent)) : 0,
        tier_count: g.tiers.length,
      })),
    };

    await this.redis.setex(cacheKey, 60, JSON.stringify(result)).catch(() => null);
    return result;
  }

  async detail(id: bigint) {
    const goods = await this.prisma.goods.findUnique({
      where: { id },
      include: {
        tiers: {
          where: { status: 1 },
          orderBy: { sort: 'asc' },
        },
      },
    });
    if (!goods || goods.status === 0) {
      throw new NotFoundException({ code: 4010, message: '商品不存在' });
    }
    return {
      id: String(goods.id),
      title: goods.title,
      subtitle: goods.subtitle,
      cover_img: goods.coverImg,
      description: goods.description,
      demo_url: goods.demoUrl,
      ip_proof_url: goods.ipProofUrl,
      category_id: String(goods.categoryId),
      status: goods.status,
      tiers: goods.tiers.map((t) => ({
        id: String(t.id),
        tier_code: t.tierCode,
        tier_name: t.tierName,
        price_cent: t.priceCent,
        duration_days: t.durationDays,
        sort: t.sort,
      })),
    };
  }

  async tiers(goodsId: bigint) {
    const tiers = await this.prisma.goodsTier.findMany({
      where: { goodsId, status: 1 },
      orderBy: { sort: 'asc' },
    });
    return tiers.map((t) => ({
      id: String(t.id),
      goods_id: String(t.goodsId),
      tier_code: t.tierCode,
      tier_name: t.tierName,
      price_cent: t.priceCent,
      duration_days: t.durationDays,
      sort: t.sort,
    }));
  }
}
