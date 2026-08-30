import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto, RenewOrderDto } from './dto';
import { JwtAuthGuard, JwtPayload } from '../common/jwt-auth.guard';

@ApiTags('订单 / Order')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /api/order/create
   * 创建订单 (幂等)
   */
  @Post('create')
  @ApiOperation({ summary: '创建订单' })
  async create(@Req() req: Request & { user: JwtPayload }, @Body() dto: CreateOrderDto) {
    const userId = BigInt(req.user.sub);
    return this.orderService.create(userId, req.user.user_type, dto);
  }

  /**
   * GET /api/order/list
   * 我的订单列表
   */
  @Get('list')
  @ApiOperation({ summary: '我的订单列表' })
  async list(
    @Req() req: Request & { user: JwtPayload },
    @Query('tab') tab: string = 'all',
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '20',
  ) {
    return this.orderService.list({
      userId: BigInt(req.user.sub),
      tab,
      page: Number(page),
      pageSize: Math.min(Number(pageSize) || 20, 100),
    });
  }

  /**
   * GET /api/order/detail/:order_no
   * 订单详情
   */
  @Get('detail/:order_no')
  @ApiOperation({ summary: '订单详情' })
  async detail(
    @Req() req: Request & { user: JwtPayload },
    @Param('order_no') orderNo: string,
  ) {
    return this.orderService.detail(BigInt(req.user.sub), orderNo);
  }

  /**
   * GET /api/order/status/:order_no
   * 订单状态 (轻量查询, 30 秒轮询用)
   */
  @Get('status/:order_no')
  @ApiOperation({ summary: '订单状态(轮询用)' })
  async status(
    @Req() req: Request & { user: JwtPayload },
    @Param('order_no') orderNo: string,
  ) {
    return this.orderService.status(BigInt(req.user.sub), orderNo);
  }

  /**
   * POST /api/order/renew
   * 创建续费订单 (parent_order_id 指向原订单)
   */
  @Post('renew')
  @ApiOperation({ summary: '创建续费订单' })
  async renew(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: RenewOrderDto,
  ) {
    const userId = BigInt(req.user.sub);
    return this.orderService.renew(userId, req.user.user_type, dto);
  }
}
