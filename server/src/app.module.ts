import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { KmsModule } from './kms/kms.module';
import { CommonModule } from './common/common.module';
import { CronService } from './common/cron.service';
import { AuthModule } from './auth/auth.module';
import { GoodsModule } from './goods/goods.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { AuthCodeModule } from './authcode/authcode.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    // 配置
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),

    // 日志 (结构化 JSON, winston)
    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        defaultMeta: { service: 'panr-25-backend' },
        transports: [new winston.transports.Console()],
      }),
    }),

    // 定时任务
    ScheduleModule.forRoot(),

    // 限流 (令牌桶, 默认 60 req/min, 模块级可覆盖)
    ThrottlerModule.forRoot([{ name: 'short', ttl: 60_000, limit: 60 }]),

    // 基础设施
    PrismaModule,
    RedisModule,
    KmsModule,
    CommonModule,

    // 业务模块
    AuthModule,
    GoodsModule,
    OrderModule,
    PaymentModule,
    AuthCodeModule,
    MeModule,
  ],
  providers: [CronService],
})
export class AppModule {}
