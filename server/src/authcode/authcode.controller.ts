import { Controller, Post, Body, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthCodeService } from './auth-code.service';
import { ResendDto } from './dto';
import { JwtPayload, Public } from '../common/jwt-auth.guard';
import { verifyAuthCode } from './auth-code.generator';

@ApiTags('授权码 / AuthCode')
@Controller('authcode')
export class AuthCodeController {
  constructor(private readonly authCodeService: AuthCodeService) {}

  /**
   * POST /api/authcode/resend
   * 申请重发授权码 (通过客服通道)
   */
  @ApiBearerAuth()
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '申请重发授权码' })
  async resend(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: ResendDto,
  ) {
    return this.authCodeService.resend({
      userId: BigInt(req.user.sub),
      orderId: BigInt(dto.order_id),
    });
  }

  /**
   * POST /api/authcode/validate
   * 仅校验授权码格式 + CRC32, 不查业务 (轻量, 公开)
   */
  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '校验授权码格式' })
  async validate(@Body() body: { code: string }) {
    const ok = verifyAuthCode(body.code);
    return {
      code: body.code,
      format_valid: ok,
    };
  }
}
