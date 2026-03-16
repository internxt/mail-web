/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UsageResponseV2 } from '@internxt/sdk/dist/drive/storage/types';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { SdkManager } from '..';
import { StorageService } from '.';

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Get usage', () => {
    test('when fetching the usage, then the usage should be returned', async () => {
      const response: UsageResponseV2 = {
        total: 1000,
        drive: 500,
        backups: 500,
      };

      const mockStorageClient = {
        spaceUsageV2: vi.fn().mockResolvedValue(response),
      } as any;
      vi.spyOn(SdkManager.instance, 'getStorage').mockReturnValue(mockStorageClient);

      const result = await StorageService.instance.getUsage();

      expect(result).toStrictEqual(response);
    });

    test('when fetching the usage fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockStorageClient = {
        spaceUsageV2: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getStorage').mockReturnValue(mockStorageClient);

      await expect(StorageService.instance.getUsage()).rejects.toThrow(unexpectedError);
    });
  });

  describe('Get limit', () => {
    test('When fetching the limit, then the limit should be returned', async () => {
      const response: number = 10000;

      const mockStorageClient = {
        spaceLimitV2: vi.fn().mockResolvedValue({ maxSpaceBytes: response }),
      } as any;
      vi.spyOn(SdkManager.instance, 'getStorage').mockReturnValue(mockStorageClient);

      const result = await StorageService.instance.getLimit();

      expect(result).toStrictEqual(response);
    });

    test('when fetching the limit fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockStorageClient = {
        spaceLimitV2: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getStorage').mockReturnValue(mockStorageClient);

      await expect(StorageService.instance.getLimit()).rejects.toThrow(unexpectedError);
    });
  });
});
