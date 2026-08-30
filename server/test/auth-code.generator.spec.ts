import {
  generateAuthCode,
  verifyAuthCode,
  parseAuthCodeType,
} from '../src/authcode/auth-code.generator';

describe('AuthCodeGenerator', () => {
  describe('format', () => {
    it('should produce MEMB-M-XXXXXXXXXXXXXXXXXXXX-XYZW format (29 chars)', () => {
      const code = generateAuthCode();
      expect(code).toMatch(/^MEMB-[MR]-[0-9A-HJ-NP-Z]{20}-[0-9A-HJ-NP-Z]{4}$/);
      expect(code.length).toBe(29);
    });

    it('should produce type M by default', () => {
      expect(parseAuthCodeType(generateAuthCode())).toBe('M');
    });

    it('should produce type R when requested', () => {
      expect(parseAuthCodeType(generateAuthCode('R'))).toBe('R');
    });

    it('should reject invalid type', () => {
      expect(() => generateAuthCode('X' as any)).toThrow();
    });
  });

  describe('verify', () => {
    it('should accept a freshly generated code', () => {
      const code = generateAuthCode();
      expect(verifyAuthCode(code)).toBe(true);
    });

    it('should reject code with wrong length', () => {
      expect(verifyAuthCode('MEMB-M-AAAAAAAAAAAAAAAAAAAA-AAAA')).toBe(false); // 28 chars
      expect(verifyAuthCode('MEMB-M-AAAAAAAAAAAAAAAAAAAAA-AAAA')).toBe(false); // 30 chars
    });

    it('should reject code with wrong prefix', () => {
      expect(verifyAuthCode('XXXX-M-AAAAAAAAAAAAAAAAAAAA-AAAA')).toBe(false);
    });

    it('should reject code with bad type', () => {
      expect(verifyAuthCode('MEMB-X-AAAAAAAAAAAAAAAAAAAA-AAAA')).toBe(false);
    });

    it('should reject code with bad characters (I/L/O/U)', () => {
      // I/L/O/U 不在 Crockford 中
      expect(verifyAuthCode('MEMB-M-IIIIIIIIIIIIIIIIIII-AAAA')).toBe(false);
      expect(verifyAuthCode('MEMB-M-LLLLLLLLLLLLLLLLLLL-AAAA')).toBe(false);
      expect(verifyAuthCode('MEMB-M-OOOOOOOOOOOOOOOOOOOO-AAAA')).toBe(false);
      expect(verifyAuthCode('MEMB-M-UUUUUUUUUUUUUUUUUUUU-AAAA')).toBe(false);
    });

    it('should reject code with wrong CRC', () => {
      // 合法随机码, 篡改 CRC
      const code = generateAuthCode();
      const tampered = code.slice(0, -4) + 'ZZZZ';
      expect(verifyAuthCode(tampered)).toBe(false);
    });

    it('should reject code with wrong body', () => {
      // 篡改随机部分
      const code = generateAuthCode();
      const tampered = code.slice(0, 7) + 'A'.repeat(20) + code.slice(27);
      expect(verifyAuthCode(tampered)).toBe(false);
    });
  });

  describe('uniqueness', () => {
    it('should generate 10000 unique codes (80-bit entropy check)', () => {
      const set = new Set<string>();
      for (let i = 0; i < 10000; i++) {
        set.add(generateAuthCode());
      }
      expect(set.size).toBe(10000);
    });
  });

  describe('performance', () => {
    it('should generate 50000 codes per second per instance', () => {
      const start = Date.now();
      const N = 50000;
      for (let i = 0; i < N; i++) {
        generateAuthCode();
      }
      const elapsed = Date.now() - start;
      const qps = Math.floor((N / elapsed) * 1000);
      // 单实例 ≥5w QPS (DoD)
      expect(qps).toBeGreaterThanOrEqual(50000);
    });
  });

  describe('parse', () => {
    it('should return null for invalid code', () => {
      expect(parseAuthCodeType('not a code')).toBe(null);
    });

    it('should return type M for main code', () => {
      const code = generateAuthCode('M');
      expect(parseAuthCodeType(code)).toBe('M');
    });

    it('should return type R for resend code', () => {
      const code = generateAuthCode('R');
      expect(parseAuthCodeType(code)).toBe('R');
    });
  });
});
