/**
 * KMS 占位 (dev/staging 用 env, prod 必须切换)
 *
 * 责任:
 * - AES-256-GCM 手机号加解密 (phone_enc)
 * - 微信支付 V3 APIv3 密钥 / 商户私钥获取
 * - JWT secret 加载 (HS256)
 *
 * 安全约束:
 * - 不在代码中硬编码密钥
 * - dev/staging 临时密钥必须从环境变量加载
 * - prod 切换 KMS 后, 密钥托管由云厂商 KMS 完成
 */

import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

export interface KmsProvider {
  getSecret(key: string): Promise<string>;
}

@Injectable()
export class EnvKmsProvider implements KmsProvider {
  async getSecret(key: string): Promise<string> {
    const value = process.env[key];
    if (!value) {
      throw new Error(`KMS secret ${key} not configured (env mode)`);
    }
    return value;
  }
}

@Injectable()
export class KmsService {
  private readonly logger = new Logger(KmsService.name);

  constructor(private readonly provider: KmsProvider) {}

  /** 获取密钥 (通用) */
  async getSecret(key: string): Promise<string> {
    return this.provider.getSecret(key);
  }

  /** AES-256-GCM 加密 (返回 base64) */
  async encryptPhone(phone: string): Promise<string> {
    const key = await this.getSecret('KMS_PHONE_KEY');
    const keyBuf = Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf8');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyBuf, iv);
    const enc = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // base64(iv + tag + enc)
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  /** AES-256-GCM 解密 */
  async decryptPhone(encryptedBase64: string): Promise<string> {
    const key = await this.getSecret('KMS_PHONE_KEY');
    const keyBuf = Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf8');
    const buf = Buffer.from(encryptedBase64, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', keyBuf, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  }

  /** phone SHA-256 哈希 (用于 phone_hash 索引, 不可逆) */
  hashPhone(phone: string): string {
    return createHash('sha256').update(phone).digest('hex');
  }

  /** 手机号脱敏 (138****1234) */
  maskPhone(phone: string): string {
    if (!phone || phone.length !== 11) return '';
    return `${phone.slice(0, 3)}****${phone.slice(4)}`;
  }
}
