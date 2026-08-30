import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../common/jwt-auth.guard';
import { WxLoginDto, RefreshDto } from './dto';

@ApiTags('用户 / Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 微信登录(code 换 openid + JWT 双 Token)
   * POST /api/auth/wx-login
   */
  @Public()
  @Post('wx-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信登录(code 换 openid + JWT)' })
  async wxLogin(@Body() dto: WxLoginDto) {
    return this.authService.wxLogin(dto);
  }

  /**
   * 刷新 access_token
   * POST /api/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新 access_token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }
}
