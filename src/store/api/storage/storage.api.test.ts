import { describe, test, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { storageApi } from '.';
import { StorageService } from '@/services/sdk/storage';
import { ErrorService } from '@/services/error';
import { FetchStorageLimitError, FetchStorageUsageError } from '@/errors';

vi.mock('@/services/error', () => ({
  ErrorService: {
    instance: {
      castError: vi.fn((err) => ({ message: err.message, requestId: 'req-123' })),
    },
  },
}));

const createTestStore = () =>
  configureStore({
    reducer: { [storageApi.reducerPath]: storageApi.reducer },
    middleware: (getDefault) => getDefault().concat(storageApi.middleware),
  });

describe('Storage Query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Get Usage', () => {
    test('When fetching usage succeeds, then it should return the total usage', async () => {
      const userUsage = {
        backups: 5000,
        total: 10000,
        drive: 5000,
      };
      const getUsageSpy = vi.spyOn(StorageService.instance, 'getUsage').mockResolvedValue(userUsage);

      const store = createTestStore();
      const result = await store.dispatch(storageApi.endpoints.getStorageUsage.initiate());

      expect(result.data).toStrictEqual(userUsage.total);
      expect(getUsageSpy).toHaveBeenCalledOnce();
    });

    test('When fetching usage fails, then an error indicating so is thrown', async () => {
      vi.spyOn(StorageService.instance, 'getUsage').mockRejectedValue(new Error('Network error'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');

      const store = createTestStore();
      const result = await store.dispatch(storageApi.endpoints.getStorageUsage.initiate());

      expect(result.error).toBeInstanceOf(FetchStorageUsageError);
      expect(castErrorSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Get Limit', () => {
    test('When fetching limit succeeds, then it should return the limit', async () => {
      const maxSpaceBytes = 107374182400;
      const getLimitSpy = vi.spyOn(StorageService.instance, 'getLimit').mockResolvedValue(maxSpaceBytes);

      const store = createTestStore();
      const result = await store.dispatch(storageApi.endpoints.getStorageLimit.initiate());

      expect(result.data).toStrictEqual(maxSpaceBytes);
      expect(getLimitSpy).toHaveBeenCalledOnce();
    });

    test('When fetching limit fails, then an error indicating so is thrown', async () => {
      vi.spyOn(StorageService.instance, 'getLimit').mockRejectedValue(new Error('Unauthorized'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');

      const store = createTestStore();
      const result = await store.dispatch(storageApi.endpoints.getStorageLimit.initiate());

      expect(result.error).toBeInstanceOf(FetchStorageLimitError);
      expect(castErrorSpy).toHaveBeenCalledOnce();
    });
  });
});
