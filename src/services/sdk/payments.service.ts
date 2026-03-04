import { type Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { type UserSubscription } from '@internxt/sdk/dist/drive/payments/types/types';
import { SdkManager } from '.';

export class PaymentsService {
  public static readonly instance: PaymentsService = new PaymentsService();

  public getUserTier = async (): Promise<Tier> => {
    const paymentsClient = SdkManager.instance.getPayments();
    return paymentsClient.getUserTier();
  };

  public getUserSubscription = async (): Promise<UserSubscription> => {
    const paymentsClient = SdkManager.instance.getPayments();
    return paymentsClient.getUserSubscription();
  };
}
