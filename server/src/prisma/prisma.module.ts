import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

/**
 * PrismaModule (Global):
 * - 提供字符串 token `PRISMA_CLIENT` (工厂, 唯一实例)
 * - 同时 alias 为 class token `PrismaClient` (useExisting), 让 10 个 service
 *   的 `private readonly prisma: PrismaClient` 类注入直接命中, 无需每个 service
 *   都改成 `@Inject(PRISMA_CLIENT)`
 */
@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: () => {
        const client = new PrismaClient({
          log: process.env.NODE_ENV === 'production'
            ? ['warn', 'error']
            : ['warn', 'error', 'info'],
        });
        return client;
      },
    },
    {
      provide: PrismaClient,
      useExisting: PRISMA_CLIENT,
    },
  ],
  exports: [PRISMA_CLIENT, PrismaClient],
})
export class PrismaModule {}
