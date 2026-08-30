import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { PayNotifyService } from './pay-notify.service';
import { UnifiedOrderDto } from './dto';
import { JwtAuthGuard, JwtPayload, Public } from '../common/jwt-auth.guard';
import { SkipPayGuard, WxPayEnabledGuard } from './wx-pay-enabled.guard';

@ApiTags('支付 / Payment')
@Controller('pay')
// Guard 顺序很重要: WxPayEnabledGuard 先于 JwtAuthGuard。
// WECHAT_PAY_* env 缺失时, 直接返 5030 (业务降级), 不被 JwtAuthGuard 的 401 拦截。
// /api/pay/notify 走 @Public() + @SkipPayGuard() 同时跳过两者。
@UseGuards(WxPayEnabledGuard, JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly notifyService: PayNotifyService,
  ) {}

  /**
   * POST /api/pay/unifiedorder
   * 微信 JSAPI 统一下单
   */
  @ApiBearerAuth()
  @Post('unifiedorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信 JSAPI 统一下单' })
  async unifiedorder(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: UnifiedOrderDto,
  ) {
    return this.paymentService.unifiedorder({
      userId: BigInt(req.user.sub),
      orderId: BigInt(dto.order_id),
      openid: dto.openid,
    });
  }

  /**
   * GET /api/pay/query
   * 主动查单(前端 30s 轮询用)
   */
  @ApiBearerAuth()
  @Get('query')
  @ApiOperation({ summary: '主动查单' })
  async query(
    @Req() req: Request & { user: JwtPayload },
    @Query('order_no') orderNo: string,
  ) {
    return this.paymentService.query({
      userId: BigInt(req.user.sub),
      orderNo,
    });
  }

  /**
   * POST /api/pay/notify
   * 微信支付成功回调(V3 验签 + 幂等)
   *
   * 跳过支付开关守卫: 回调属内部入口, env 留空时即便接到也会在验签/AES-256-GCM
   * 解密阶段自然失败; 不在守卫层硬拦截, 方便 ops 人工 curl 一笔测试通知。
   */
  @Public()
  @SkipPayGuard()
  @Post('notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信支付成功回调' })
  async notify(
    @Headers('wechatpay-signature') signature: string,
    @Headers('wechatpay-timestamp') timestamp: string,
    @Headers('wechatpay-nonce') nonce: string,
    @Headers('wechatpay-serial') serial: string,
    @Body() body: any,
  ) {
    return this.notifyService.handleNotify({ signature, timestamp, nonce, serial, body });
  }
}
