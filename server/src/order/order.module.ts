import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStateMachine } from './order-state-machine';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderStateMachine],
  exports: [OrderService, OrderStateMachine],
})
export class OrderModule {}
