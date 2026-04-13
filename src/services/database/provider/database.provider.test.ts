import 'fake-indexeddb/auto';
import { describe, test, expect, vi, afterEach, beforeAll } from 'vitest';
import { DatabaseProvider } from '.';
import { DatabaseService } from '..';
import { EmailRepository } from '../emails/repository';
import { MnemonicNotFoundError, ProviderNotInitializedError } from '@/errors/database';
import { getMockedUser } from '@/test-utils/fixtures';
import { LocalStorageService } from '@/services/local-storage';

vi.mock('internxt-crypto', () => ({
  mnemonicToBytes: vi.fn().mockReturnValue(new Uint8Array(16)),
  deriveDatabaseKey: vi.fn().mockResolvedValue(new Uint8Array(32)),
}));

describe('Database Provider', () => {
  beforeAll(() => {
    vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue('mock mnemonic phrase');
    vi.spyOn(LocalStorageService.instance, 'getUser').mockReturnValue(getMockedUser());
  });

  afterEach(() => {
    try {
      DatabaseProvider.getInstance().disconnect();
    } catch {
      // Not initialized
    }
  });

  describe('Init', () => {
    test('When initializing, then it should open the database', async () => {
      const openSpy = vi.spyOn(DatabaseService.prototype, 'open');

      await DatabaseProvider.init();

      expect(openSpy).toHaveBeenCalledOnce();
    });

    test('When initializing, then it should return a provider with email repository', async () => {
      const provider = await DatabaseProvider.init();

      expect(provider.emails).toBeInstanceOf(EmailRepository);
    });

    test('When initializing twice, then it should return the same instance', async () => {
      const first = await DatabaseProvider.init();
      const second = await DatabaseProvider.init();

      expect(first).toBe(second);
    });

    test('When initializing without a mnemonic, then an error should be thrown', async () => {
      const { LocalStorageService } = await import('@/services/local-storage');
      vi.mocked(LocalStorageService.instance.getMnemonic).mockReturnValueOnce(null);

      await expect(DatabaseProvider.init()).rejects.toThrow(MnemonicNotFoundError);
    });
  });

  describe('Get instance', () => {
    test('When getting instance before init, then it should throw an error', () => {
      expect(() => DatabaseProvider.getInstance()).toThrow(ProviderNotInitializedError);
    });

    test('When getting instance after init, then it should return the provider', async () => {
      await DatabaseProvider.init();

      const provider = DatabaseProvider.getInstance();

      expect(provider.emails).toBeInstanceOf(EmailRepository);
    });
  });

  describe('Destroy', () => {
    test('When destroying, then it should close the database', async () => {
      await DatabaseProvider.init();
      const closeSpy = vi.spyOn(DatabaseService.prototype, 'close');

      DatabaseProvider.getInstance().disconnect();

      expect(closeSpy).toHaveBeenCalledOnce();
    });

    test('When destroying, then getInstance should throw', async () => {
      await DatabaseProvider.init();

      DatabaseProvider.getInstance().disconnect();

      expect(() => DatabaseProvider.getInstance()).toThrow(ProviderNotInitializedError);
    });

    test('When destroying and re-initializing, then it should create a new instance', async () => {
      const first = await DatabaseProvider.init();
      first.disconnect();

      const second = await DatabaseProvider.init();

      expect(second).not.toBe(first);
    });
  });
});
