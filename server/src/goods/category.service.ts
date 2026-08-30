import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async list() {
    const cacheKey = 'category:list';
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    const items = await this.prisma.category.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    });
    const result = items.map((c) => ({
      id: c.id,
      name: c.name,
      sort: c.sort,
    }));
    await this.redis.setex(cacheKey, 300, JSON.stringify(result)).catch(() => null);
    return result;
  }
}
