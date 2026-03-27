import { StorageService } from '@/services/sdk/storage';
import { FetchStorageLimitError, FetchStorageUsageError } from '@/errors';
import { ErrorService } from '@/services/error';
import { api } from '../base';

export const storageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStorageUsage: builder.query<number, void>({
      async queryFn() {
        try {
          const usage = await StorageService.instance.getUsage();
          return { data: usage.total };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchStorageUsageError(err.message, err.requestId) };
        }
      },
      providesTags: ['StorageUsage'],
    }),
    getStorageLimit: builder.query<number, void>({
      async queryFn() {
        try {
          const limit = await StorageService.instance.getLimit();
          return { data: limit };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchStorageLimitError(err.message, err.requestId) };
        }
      },
      providesTags: ['StorageLimit'],
    }),
  }),
});

export const { useGetStorageLimitQuery, useGetStorageUsageQuery } = storageApi;
