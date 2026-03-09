/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { SdkManager } from '.';
import { PaymentsService } from './payments.service';

describe('Payments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User tier retrieval', () => {
    test('When fetching user tier, then tier data should be returned', async () => {
      const mockedTier = {
        id: 'free',
        billingType: 'subscription',
        label: 'Test',
        productId: 'product-id',
        featuresPerService: {
          'service-1': {
            features: ['feature-1', 'feature-2'],
          },
          'service-2': {
            features: ['feature-3', 'feature-4'],
          },
        },
      };

      const mockPaymentsClient = {
        getUserTier: vi.fn().mockResolvedValue(mockedTier),
      } as any;

      vi.spyOn(SdkManager.instance, 'getPayments').mockReturnValue(mockPaymentsClient);

      const result = await PaymentsService.instance.getUserTier();

      expect(result).toStrictEqual(mockedTier);
      expect(mockPaymentsClient.getUserTier).toHaveBeenCalledTimes(1);
    });

    test('When tier retrieval fails, then error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockPaymentsClient = {
        getUserTier: vi.fn().mockRejectedValue(unexpectedError),
      } as any;

      vi.spyOn(SdkManager.instance, 'getPayments').mockReturnValue(mockPaymentsClient);

      await expect(PaymentsService.instance.getUserTier()).rejects.toThrow(unexpectedError);
    });
  });

  describe('User subscription retrieval', () => {
    test('When fetching user subscription, then subscription data should be returned', async () => {
      const mockedSubscription = {
        id: 'subscription-id',
        status: 'active',
      };

      const mockPaymentsClient = {
        getUserSubscription: vi.fn().mockResolvedValue(mockedSubscription),
      } as any;

      vi.spyOn(SdkManager.instance, 'getPayments').mockReturnValue(mockPaymentsClient);

      const result = await PaymentsService.instance.getUserSubscription();

      expect(result).toStrictEqual(mockedSubscription);
      expect(mockPaymentsClient.getUserSubscription).toHaveBeenCalledTimes(1);
    });

    test('When subscription retrieval fails, then error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockPaymentsClient = {
        getUserSubscription: vi.fn().mockRejectedValue(unexpectedError),
      } as any;

      vi.spyOn(SdkManager.instance, 'getPayments').mockReturnValue(mockPaymentsClient);

      await expect(PaymentsService.instance.getUserSubscription()).rejects.toThrow(unexpectedError);
    });
  });
});
