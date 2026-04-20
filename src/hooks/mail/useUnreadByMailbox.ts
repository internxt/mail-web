import { useMemo } from 'react';
import type { MailboxResponse } from '@internxt/sdk';
import { useGetMailboxesInfoQuery } from '@/store/api/mail';

type UnreadByMailbox = Record<Exclude<MailboxResponse['type'], null>, number | undefined>;

export const useUnreadByMailbox = (options?: Parameters<typeof useGetMailboxesInfoQuery>[1]) => {
  const { data: mailboxes, ...rest } = useGetMailboxesInfoQuery(undefined, options);

  const unreadByMailbox = useMemo(
    () => Object.fromEntries(mailboxes?.map((m) => [m.type, m.unreadEmails]) ?? []) as UnreadByMailbox,
    [mailboxes],
  );

  return { unreadByMailbox, ...rest };
};
