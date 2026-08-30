import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { GoodsService } from './goods.service';
import { Public } from '../common/jwt-auth.guard';

@ApiTags('商品 / Goods')
@Controller('goods')
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  /**
   * GET /api/goods/list
   * 商品列表(分页 + 类目 + 关键词)
   */
  @Public()
  @Get('list')
  @ApiOperation({ summary: '商品列表(分页 + 类目 + 关键词)' })
  @ApiQuery({ name: 'category_id', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'page_size', required: false })
  async list(
    @Query('category_id') categoryId?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '20',
  ) {
    return this.goodsService.list({
      categoryId: categoryId ? Number(categoryId) : undefined,
      keyword,
      page: Number(page),
      pageSize: Math.min(Number(pageSize) || 20, 100),
    });
  }

  /**
   * GET /api/goods/detail/:id
   * 商品详情(含档位 + 类目)
   */
  @Public()
  @Get('detail/:id')
  @ApiOperation({ summary: '商品详情(含档位)' })
  async detail(@Param('id') id: string) {
    return this.goodsService.detail(BigInt(id));
  }

  /**
   * GET /api/goods/tiers/:goods_id
   * 商品档位列表
   */
  @Public()
  @Get('tiers/:goods_id')
  @ApiOperation({ summary: '商品档位列表' })
  async tiers(@Param('goods_id') goodsId: string) {
    return this.goodsService.tiers(BigInt(goodsId));
  }
}
