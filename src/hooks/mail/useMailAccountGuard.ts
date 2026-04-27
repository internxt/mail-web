import { skipToken } from '@reduxjs/toolkit/query';
import { useGetMailAccountKeysQuery } from '@/store/api/mail';
import { useAppSelector } from '@/store/hooks';
import { MailNotSetupError } from '@/errors';

export type MailAccountGuardStatus = 'loading' | 'ready' | 'not-setup' | 'error';

export const useMailAccountGuard = (): { status: MailAccountGuardStatus } => {
  const userEmail = useAppSelector((state) => state.user.user?.email);
  const { data, error, isLoading, isFetching } = useGetMailAccountKeysQuery(
    userEmail ? { address: userEmail } : skipToken,
  );

  if (!userEmail || isLoading || isFetching) return { status: 'loading' };
  if (error instanceof MailNotSetupError) return { status: 'not-setup' };
  if (error) return { status: 'error' };
  if (data) return { status: 'ready' };
  return { status: 'loading' };
};
