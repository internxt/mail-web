/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { CryptoService } from '.';
import { ConfigService } from '../config';
import { LocalStorageService } from '../local-storage';
import { SdkManager } from '../sdk';
import CryptoJS from 'crypto-js';

vi.mock('../sdk', () => ({
  SdkManager: {
    instance: {
      getAuth: vi.fn(),
    },
  },
}));

describe('Crypto Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Convert to hash', () => {
    test('When a salt is provided, then it should produce a deterministic hash', () => {
      const salt = 'abcdef1234567890abcdef1234567890';

      const result = CryptoService.instance.passToHash({ password: 'myPassword', salt });

      expect(result.salt).toStrictEqual(salt);
      expect(result.hash).toBeTruthy();
      expect(result.hash.length).toBeGreaterThan(0);
    });

    test('When the same password and salt are used, then the hash should be identical', () => {
      const salt = 'abcdef1234567890abcdef1234567890';

      const first = CryptoService.instance.passToHash({ password: 'myPassword', salt });
      const second = CryptoService.instance.passToHash({ password: 'myPassword', salt });

      expect(first.hash).toStrictEqual(second.hash);
    });

    test('When no salt is provided, then a random salt should be generated', () => {
      const result = CryptoService.instance.passToHash({ password: 'myPassword' });

      expect(result.salt).toBeTruthy();
      expect(result.hash).toBeTruthy();
    });

    test('When different passwords are used with the same salt, then the hashes should differ', () => {
      const salt = 'abcdef1234567890abcdef1234567890';

      const first = CryptoService.instance.passToHash({ password: 'password1', salt });
      const second = CryptoService.instance.passToHash({ password: 'password2', salt });

      expect(first.hash).not.toBe(second.hash);
    });
  });

  describe('Get Salt', () => {
    test('When the user has an email, then it should return the decrypted salt', async () => {
      const secret = 'test-secret';
      const originalSalt = 'my-decrypted-salt';
      const encrypted = CryptoJS.AES.encrypt(originalSalt, secret).toString();
      const encryptedHex = CryptoJS.enc.Base64.parse(encrypted).toString(CryptoJS.enc.Hex);

      vi.spyOn(LocalStorageService.instance, 'getUser').mockReturnValue({ email: 'user@test.com' } as any);
      vi.spyOn(ConfigService.instance, 'getVariable').mockReturnValue(secret);
      vi.mocked(SdkManager.instance.getAuth).mockReturnValue({
        securityDetails: vi.fn().mockResolvedValue({ encryptedSalt: encryptedHex }),
      } as any);

      const salt = await CryptoService.instance.getSalt();

      expect(salt).toStrictEqual(originalSalt);
    });
  });

  describe('Encrypt the text with a key', () => {
    test('When text is encrypted and then decrypted, then it should return the original text', () => {
      const secret = 'test-secret';
      vi.spyOn(ConfigService.instance, 'getVariable').mockReturnValue(secret);

      const original = 'some-hashed-password';
      const encrypted = CryptoService.instance.encryptTextWithKey(original);

      const reb = CryptoJS.enc.Hex.parse(encrypted);
      const decrypted = CryptoJS.AES.decrypt(reb.toString(CryptoJS.enc.Base64), secret).toString(CryptoJS.enc.Utf8);

      expect(decrypted).toStrictEqual(original);
    });
  });
});
