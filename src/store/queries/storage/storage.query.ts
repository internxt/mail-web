import { StorageService } from '@/services/sdk/storage';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { FetchStorageLimitError, FetchStorageUsageError } from '../errors/storage.errors';
import { ErrorService } from '@/services/error';

export const storageQuery = createApi({
  reducerPath: 'storageQuery',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Usage', 'Limit'],

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
      providesTags: ['Usage'],
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
      providesTags: ['Limit'],
    }),
  }),
});

export const { useGetStorageLimitQuery, useGetStorageUsageQuery } = storageQuery;
