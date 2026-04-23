import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Mailbox', 'ListFolder', 'MailMessage', 'StorageUsage', 'StorageLimit', 'EmailSearch'],
  endpoints: () => ({}),
});
