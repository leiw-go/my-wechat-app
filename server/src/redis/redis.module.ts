import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASS || undefined,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          // 错误重试 + 连接池
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          // 性能调优
          connectTimeout: 10_000,
          keepAlive: 30_000,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
