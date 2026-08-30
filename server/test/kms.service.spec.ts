import { KmsService, EnvKmsProvider } from '../src/kms/kms.service';

describe('KmsService', () => {
  let kms: KmsService;

  beforeAll(() => {
    process.env.KMS_PHONE_KEY = 'test_phone_key_32_bytes_xxxxxxxxxx';
    kms = new KmsService(new EnvKmsProvider());
  });

  describe('AES-256-GCM phone encryption', () => {
    it('should encrypt and decrypt back to original', async () => {
      const phone = '13800001234';
      const enc = await kms.encryptPhone(phone);
      expect(enc).toBeTruthy();
      expect(enc).not.toContain(phone);
      const dec = await kms.decryptPhone(enc);
      expect(dec).toBe(phone);
    });

    it('should produce different ciphertext each time (IV random)', async () => {
      const phone = '13800001234';
      const enc1 = await kms.encryptPhone(phone);
      const enc2 = await kms.encryptPhone(phone);
      expect(enc1).not.toBe(enc2);
    });

    it('should fail to decrypt tampered ciphertext', async () => {
      const phone = '13800001234';
      const enc = await kms.encryptPhone(phone);
      const tampered = enc.slice(0, -2) + 'AA';
      await expect(kms.decryptPhone(tampered)).rejects.toThrow();
    });

    it('should not leak phone number in encrypted output', async () => {
      const phone = '13912345678';
      const enc = await kms.encryptPhone(phone);
      const buf = Buffer.from(enc, 'base64');
      const decStr = buf.toString('utf8');
      expect(decStr).not.toContain(phone);
    });
  });

  describe('phone hash', () => {
    it('should produce SHA-256 hex', () => {
      const hash = kms.hashPhone('13800001234');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should be deterministic', () => {
      const h1 = kms.hashPhone('13800001234');
      const h2 = kms.hashPhone('13800001234');
      expect(h1).toBe(h2);
    });

    it('should be different for different phones', () => {
      const h1 = kms.hashPhone('13800001234');
      const h2 = kms.hashPhone('13800005678');
      expect(h1).not.toBe(h2);
    });
  });

  describe('phone mask', () => {
    it('should mask 11-digit phone', () => {
      expect(kms.maskPhone('13800001234')).toBe('138****1234');
    });

    it('should return empty for non-11-digit', () => {
      expect(kms.maskPhone('1234')).toBe('');
      expect(kms.maskPhone('')).toBe('');
    });
  });

  describe('secret retrieval', () => {
    it('should throw for missing env secret', async () => {
      const orig = process.env.TEST_SECRET_MISSING;
      delete process.env.TEST_SECRET_MISSING;
      await expect(kms.getSecret('TEST_SECRET_MISSING')).rejects.toThrow();
      if (orig !== undefined) process.env.TEST_SECRET_MISSING = orig;
    });
  });
});
