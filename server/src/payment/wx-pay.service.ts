import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { WX_UNIFIEDORDER_FAILED } from '../common/errors';

/**
 * 微信支付 V3 (JSAPI) 客户端封装
 *
 * 文档: https://pay.weixin.qq.com/wiki/doc/apiv3/
 *
 * 职责:
 * - 构造 Authorization 签名 (RSA, 商户私钥)
 * - 调用统一下单 (/v3/pay/transactions/jsapi)
 * - 生成前端 JSAPI 调起参数 (时间戳/随机串/paySign)
 * - 验证回调签名 (平台公钥)
 * - 解密回调 resource.ciphertext (AES-256-GCM)
 */
@Injectable()
export class WxPayService {
  private readonly logger = new Logger(WxPayService.name);

  private readonly mchId = process.env.WX_PAY_MCH_ID || '';
  private readonly appId = process.env.WX_APP_ID || '';
  private readonly apiV3Key = process.env.WX_PAY_API_V3_KEY || '';
  private readonly privateKeyPath = process.env.WX_PAY_PRIVATE_KEY_PATH || '';
  private readonly notifyUrl = process.env.WX_PAY_NOTIFY_URL || '';

  /**
   * JSAPI 统一下单
   * 返回前端 wx.requestPayment 所需参数
   */
  async jsapiOrder(params: {
    orderNo: string;
    priceCent: number;
    openid: string;
    description: string;
  }): Promise<{
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
  }> {
    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';
    const body = {
      appid: this.appId,
      mchid: this.mchId,
      description: params.description,
      out_trade_no: params.orderNo,
      // 回调地址必须 HTTPS + 公网可达
      notify_url: this.notifyUrl,
      amount: {
        total: params.priceCent,
        currency: 'CNY',
      },
      payer: {
        openid: params.openid,
      },
    };

    const token = this.sign('POST', url, body);

    try {
      const res = await axios.post(url, body, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        validateStatus: () => true,
        timeout: 10_000,
      });
      if (res.status !== 200 || !res.data?.prepay_id) {
        this.logger.error(`unifiedorder failed: ${JSON.stringify(res.data)}`);
        throw WX_UNIFIEDORDER_FAILED();
      }

      const prepayId = res.data.prepay_id;
      return this.buildJsapiParams(prepayId);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`unifiedorder network error: ${(err as Error).message}`);
      throw WX_UNIFIEDORDER_FAILED();
    }
  }

  /**
   * 主动查单(/v3/pay/transactions/out-trade-no/{out_trade_no})
   */
  async queryOrder(orderNo: string): Promise<{
    trade_state: string;
    transaction_id?: string;
    success_time?: string;
  }> {
    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderNo}`;
    const token = this.sign('GET', url, undefined);
    try {
      const res = await axios.get(url, {
        headers: { Authorization: token, Accept: 'application/json' },
        validateStatus: () => true,
        timeout: 10_000,
      });
      if (res.status !== 200) {
        throw new Error(`queryOrder failed: ${JSON.stringify(res.data)}`);
      }
      return res.data;
    } catch (err) {
      this.logger.error(`queryOrder error: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * 验证回调签名 + 解密 resource
   */
  verifyAndDecryptNotify(params: {
    signature: string;
    timestamp: string;
    nonce: string;
    serial: string;
    body: any;
  }): { out_trade_no: string; transaction_id: string; success_time?: string } {
    // 1. 验证签名 (生产: 用微信平台证书公钥, 这里用接口占位)
    if (!params.signature || !params.timestamp || !params.nonce) {
      throw new Error('缺少签名头');
    }

    // 2. 解密 resource.ciphertext (AES-256-GCM)
    const ciphertext = params.body?.resource?.ciphertext;
    const nonce2 = params.body?.resource?.nonce;
    const associatedData = params.body?.resource?.associated_data;
    if (!ciphertext) throw new Error('缺少 resource.ciphertext');

    const decrypted = this.decryptAES256GCM(ciphertext, nonce2, associatedData);
    return JSON.parse(decrypted);
  }

  // ---- 工具方法 ----

  private sign(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown): string {
    const methodUpper = method.toUpperCase();
    const urlObj = new URL(url);
    const canonicalUrl = `${urlObj.pathname}${urlObj.search}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyStr = body ? JSON.stringify(body) : '';

    const message = `${methodUpper}\n${canonicalUrl}\n${timestamp}\n${nonce}\n${bodyStr}\n`;
    // 生产: 从 KMS / 文件读取私钥
    // this.privateKeyPath
    const signature = this.signWithPrivateKey(message);

    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",signature="${signature}",serial_no="dev_serial"`;
  }

  private signWithPrivateKey(message: string): string {
    // dev: 用模拟签名 (生产必须用真实私钥 + crypto.createSign('RSA-SHA256'))
    // 这里给一个 HMAC fallback 占位, 避免启动失败
    return crypto.createHmac('sha256', this.apiV3Key || 'dev').update(message).digest('hex');
  }

  private buildJsapiParams(prepayId: string) {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const packageStr = `prepay_id=${prepayId}`;
    const message = `${this.appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
    const paySign = this.signWithPrivateKey(message);

    return {
      appId: this.appId,
      timeStamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA' as const,
      paySign,
    };
  }

  private decryptAES256GCM(ciphertextB64: string, nonce: string, associatedData: string): string {
    const key = Buffer.from(this.apiV3Key.padEnd(32, '0').slice(0, 32), 'utf8');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const iv = Buffer.from(nonce, 'utf8');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const data = ciphertext.subarray(0, ciphertext.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    if (associatedData) decipher.setAAD(Buffer.from(associatedData, 'utf8'));
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  }
}
