import { describe, expect, vi, beforeEach, test, afterEach } from 'vitest';
import { VariableNotFoundError } from './config.errors';

import { ConfigService } from '.';
describe('Config Service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DRIVE_API_URL', 'https://api-drive.internxt.com');
    vi.stubEnv('VITE_MAIL_API_URL', 'https://api-mail.internxt.com');
    vi.stubEnv('VITE_PAYMENTS_API_URL', 'https://api-payments.internxt.com');
    vi.stubEnv('VITE_CRYPTO_SECRET', 'test-secret');
    vi.stubEnv('VITE_MAGIC_IV', 'test-iv');
    vi.stubEnv('VITE_MAGIC_SALT', 'test-salt');
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const configService = ConfigService.instance;

  describe('Get Variable', () => {
    test('When getting an existing variable, then it should be returned successfully', () => {
      const result = configService.getVariable('DRIVE_API_URL');
      expect(result).toBe('https://api-drive.internxt.com');
    });

    test('When the variable does not exist, then an error indicating so is thrown', () => {
      vi.stubEnv('VITE_DRIVE_API_URL', undefined);

      expect(() => configService.getVariable('DRIVE_API_URL')).toThrow(VariableNotFoundError);
    });
  });

  describe('Checking if the environment is production', () => {
    test('When the environment is not production, then should indicate so', () => {
      expect(configService.isProduction()).toBe(false);
    });

    test('When the environment is production, then should indicate so', () => {
      vi.stubEnv('PROD', true);

      expect(configService.isProduction()).toBe(true);
    });
  });
});
