import { Injectable, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { JwtPayload } from '../common/jwt-auth.guard';
import { WxCode2SessionService } from './wx-code2session.service';
import { WxLoginDto, RefreshDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
    private readonly wxService: WxCode2SessionService,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async wxLogin(dto: WxLoginDto) {
    const { openid, unionid } = await this.wxService.exchange(dto.code);

    // upsert user
    const user = await this.prisma.user.upsert({
      where: { openid },
      create: {
        openid,
        unionid: unionid ?? null,
        userType: 2, // 默认 C 端, 首次下单时升级为 B 端
      },
      update: {
        unionid: unionid ?? undefined,
        lastLoginAt: new Date(),
      },
    });

    // 签发双 Token
    const tokens = await this.issueTokens(user.id, user.userType);

    // refresh_token 落 Redis (黑名单 + 主动失效)
    await this.redis.set(
      `refresh:${user.id}:${tokens.refresh_id}`,
      '1',
      'EX',
      parseInt(process.env.JWT_REFRESH_TTL || '604800', 10),
    );

    return {
      access_token: tokens.access_token,
      refresh_token: `${tokens.refresh_id}.${tokens.refresh_secret}`,
      expires_in: parseInt(process.env.JWT_ACCESS_TTL || '7200', 10),
      user: {
        id: String(user.id),
        user_type: user.userType,
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    const [refreshId, refreshSecret] = dto.refresh_token.split('.');
    if (!refreshId || !refreshSecret) {
      throw new Error('refresh_token 格式非法');
    }

    // 查询 refresh_token 是否在 Redis 中(未被吊销)
    // 这里简化: 只校验格式 + 关联用户
    const userId = this.decodeRefreshId(refreshId);
    if (!userId) {
      throw new Error('refresh_token 无效');
    }

    const exists = await this.redis.get(`refresh:${userId}:${refreshId}`);
    if (!exists) {
      throw new Error('refresh_token 已失效, 请重新登录');
    }

    const user = await this.prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) throw new Error('用户不存在');

    // 旋转 refresh_token (旧 refresh 失效)
    await this.redis.del(`refresh:${userId}:${refreshId}`);
    const tokens = await this.issueTokens(user.id, user.userType);
    await this.redis.set(
      `refresh:${user.id}:${tokens.refresh_id}`,
      '1',
      'EX',
      parseInt(process.env.JWT_REFRESH_TTL || '604800', 10),
    );

    return {
      access_token: tokens.access_token,
      expires_in: parseInt(process.env.JWT_ACCESS_TTL || '7200', 10),
    };
  }

  private async issueTokens(userId: bigint, userType: number) {
    const payload: JwtPayload = {
      sub: String(userId),
      user_type: userType,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + parseInt(process.env.JWT_ACCESS_TTL || '7200', 10),
    };
    const access_token = await this.jwtService.signAsync(payload);

    const refresh_id = randomBytes(16).toString('hex');
    const refresh_secret = randomBytes(32).toString('hex');
    return { access_token, refresh_id, refresh_secret };
  }

  private decodeRefreshId(refreshId: string): string | null {
    // 简化: 直接当 user_id 用, 生产应加密
    return /^[0-9]+$/.test(refreshId) ? refreshId : null;
  }
}
