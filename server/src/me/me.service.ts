import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KmsService } from '../kms/kms.service';

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly kms: KmsService,
    @Inject('REDIS_CLIENT') private readonly redis: any,
  ) {}

  async info(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authCodes: {
          where: { status: 1 },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { goods: { select: { title: true } } },
        },
      },
    });
    if (!user) {
      throw new NotFoundException({ code: 4012, message: '用户不存在' });
    }

    // phone_enc 解密 (仅用于脱敏展示)
    let phoneMask: string | null = null;
    if (user.phoneEnc) {
      try {
        const plain = await this.kms.decryptPhone(user.phoneEnc);
        phoneMask = this.kms.maskPhone(plain);
      } catch {
        phoneMask = null;
      }
    }

    // 营业执照后四位
    let bizLicenseMask: string | null = null;
    if (user.bizLicenseNo) {
      bizLicenseMask = `****${user.bizLicenseNo.slice(-4)}`;
    }

    return {
      id: String(user.id),
      user_type: user.userType,
      nickname: user.nickname,
      avatar_url: user.avatarUrl,
      company_name: user.companyName,
      biz_license_no_mask: bizLicenseMask,
      phone_mask: phoneMask,
      created_at: user.createdAt.toISOString(),
      last_login_at: user.lastLoginAt.toISOString(),
      active_auth_codes: user.authCodes.map((ac) => ({
        code: ac.code,
        goods_title: ac.goods.title,
        expire_at: ac.expireAt.toISOString(),
        replaced_expire: ac.replacedExpire?.toISOString() || null,
      })),
    };
  }
}
