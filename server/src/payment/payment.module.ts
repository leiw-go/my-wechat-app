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
  exports: [PaymentService, PayNotifyService],
})
export class PaymentModule {}
