import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from '../prisma/prisma.module';
import { Public } from './jwt-auth.guard';

/**
 * HealthController — 提供 /api/health/live 探针
 *
 * 用途:
 * - ops smoke test: `curl http://localhost:3000/api/health/live` → 200
 * - 极简存活探针: 进程能响应即视为 alive
 *
 * 注意:
 * - 不再区分 liveness / readiness, 单一 endpoint, 同时检查 DB 可达性
 * - DB 检查用 `SELECT 1`, 失败也返 200 + status='degraded' + dbConnected=false
 *   (避免 k8s/负载均衡器误杀进程)
 * - @Public() 标记, 不走 JwtAuthGuard / WxPayEnabledGuard
 */
@ApiTags('健康检查 / Health')
@Public()
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  @Get('live')
  @ApiOperation({
    summary: '存活探针 + DB 可达性',
    description:
      '返回 200 + { status, uptime, dbConnected }; status=ok 表示进程 + DB 均健康; status=degraded 表示进程 alive 但 DB 暂时不可达',
  })
  async live() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    let dbConnected = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    return {
      status: dbConnected ? 'ok' : 'degraded',
      uptime,
      dbConnected,
    };
  }
}
