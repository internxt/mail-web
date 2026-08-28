import type { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { FetchUserTierError } from '@/errors';
import { ErrorService } from '@/services/error';
import { PaymentsService } from '@/services/sdk/payments';
import { api } from '../base';

export const paymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserTier: builder.query<Tier, void>({
      async queryFn() {
        try {
          const tier = await PaymentsService.instance.getUserTier();
          return { data: tier };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchUserTierError(err.message, err.requestId) };
        }
      },
      providesTags: ['UserTier'],
    }),
  }),
});

export const { useGetUserTierQuery } = paymentsApi;
