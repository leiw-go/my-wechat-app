import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { WxCode2SessionService } from './wx-code2session.service';

/**
 * JwtService 由 @Global() 的 CommonModule 统一提供, 本模块不再单独注册 JwtModule。
 * 避免两份 JwtModule 实例 / 两份 secret 缓存, 配置单一来源在 CommonModule。
 */
@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, WxCode2SessionService],
  exports: [AuthService],
})
export class AuthModule {}
