import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { MeService } from './me.service';
import { JwtAuthGuard, JwtPayload } from '../common/jwt-auth.guard';

@ApiTags('个人中心 / Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  /**
   * GET /api/me/info
   * 当前用户信息 (脱敏, 不返回整号)
   */
  @Get('info')
  @ApiOperation({ summary: '当前用户信息' })
  async info(@Req() req: Request & { user: JwtPayload }) {
    return this.meService.info(BigInt(req.user.sub));
  }
}
