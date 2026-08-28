import { Service } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { useGetUserTierQuery } from '@/store/api/payments';
import { useAppSelector } from '@/store/hooks';
import { useMailAccountGuard } from './useMailAccountGuard';
import type { RootState } from '@/store';

export type MailAccessStatus = 'loading' | 'ready' | 'needs-setup' | 'plan-required' | 'error';

/**
 * Resolves whether the user can reach the mailbox, still has to set it up, or is on a plan that
 * does not include Mail. The plan is only consulted for users without a mail account: someone who
 * already provisioned Mail and then downgraded keeps access during the grace period that precedes
 * the account deletion.
 */
export const useMailAccess = (): { status: MailAccessStatus } => {
  const isAuthenticated = useAppSelector((state: RootState) => state.user.isAuthenticated);
  const { status: accountStatus } = useMailAccountGuard();
  const isSetupPending = accountStatus === 'not-setup';

  const { data: tier, isLoading: isTierLoading } = useGetUserTierQuery(undefined, {
    skip: !isAuthenticated || !isSetupPending,
  });

  if (!isAuthenticated) return { status: 'loading' };
  if (accountStatus === 'ready') return { status: 'ready' };
  if (accountStatus === 'error') return { status: 'error' };
  if (accountStatus === 'loading') return { status: 'loading' };

  if (isTierLoading) return { status: 'loading' };

  // A failed tier request must not block setup: the provisioning endpoint rejects ineligible
  // plans anyway, and that error is surfaced to the user.
  if (tier?.featuresPerService[Service.Mail]?.enabled === false) return { status: 'plan-required' };

  return { status: 'needs-setup' };
};
