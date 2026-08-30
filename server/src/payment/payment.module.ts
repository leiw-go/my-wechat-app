import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { WxPayService } from './wx-pay.service';
import { PayNotifyService } from './pay-notify.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, WxPayService, PayNotifyService],
  // WxPayService 也导出 — CronService 在 AppModule 注入, 扫超时订单 / 调起关单
  exports: [PaymentService, WxPayService, PayNotifyService],
})
export class PaymentModule {}
