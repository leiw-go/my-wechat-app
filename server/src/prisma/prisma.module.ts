import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

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
  ],
  exports: [PRISMA_CLIENT],
})
export class PrismaModule {}
