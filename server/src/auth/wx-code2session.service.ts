import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

export interface Code2SessionResult {
  openid: string;
  unionid?: string;
  session_key: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 微信 code2Session (jscode2session)
 * 文档: https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
 */
@Injectable()
export class WxCode2SessionService {
  private readonly logger = new Logger(WxCode2SessionService.name);
  private readonly url = process.env.WX_CODE2SESSION_URL || 'https://api.weixin.qq.com/sns/jscode2session';

  async exchange(code: string): Promise<Code2SessionResult> {
    const appId = process.env.WX_APP_ID;
    const appSecret = process.env.WX_APP_SECRET;
    if (!appId || !appSecret) {
      throw new ServiceUnavailableException('微信小程序配置缺失');
    }

    try {
      const res = await axios.get(this.url, {
        params: { appid: appId, secret: appSecret, js_code: code, grant_type: 'authorization_code' },
        timeout: 5_000,
        validateStatus: () => true,
      });
      const data = res.data;
      if (data.errcode && data.errcode !== 0) {
        this.logger.error(`code2Session failed: ${JSON.stringify(data)}`);
        throw new ServiceUnavailableException('微信登录失败');
      }
      return {
        openid: data.openid,
        unionid: data.unionid,
        session_key: data.session_key,
      };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`code2Session network error: ${(err as Error).message}`);
      throw new ServiceUnavailableException('微信服务暂不可用');
    }
  }
}
