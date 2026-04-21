import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useUnreadByMailbox } from './useUnreadByMailbox';
import { useGetMailboxesInfoQuery } from '@/store/api/mail';
import type { MailboxResponse } from '@internxt/sdk';

vi.mock('@/store/api/mail', () => ({
  useGetMailboxesInfoQuery: vi.fn(),
}));

const mockUseGetMailboxesInfoQuery = vi.mocked(useGetMailboxesInfoQuery);

const MAILBOXES: MailboxResponse[] = [
  { id: '1', name: 'Inbox', type: 'inbox', parentId: null, totalEmails: 100, unreadEmails: 5 },
  { id: '2', name: 'Sent', type: 'sent', parentId: null, totalEmails: 50, unreadEmails: 0 },
  { id: '3', name: 'Drafts', type: 'drafts', parentId: null, totalEmails: 10, unreadEmails: 0 },
  { id: '4', name: 'Spam', type: 'spam', parentId: null, totalEmails: 20, unreadEmails: 2 },
  { id: '5', name: 'Trash', type: 'trash', parentId: null, totalEmails: 15, unreadEmails: 0 },
];

const EXPECTED_UNREAD = Object.fromEntries(MAILBOXES.map((m) => [m.type, m.unreadEmails]));

describe('Unread By Mailbox - Custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When mailboxes are loaded, then the hook maps each mailbox type to its unread count', () => {
    mockUseGetMailboxesInfoQuery.mockReturnValue({ data: MAILBOXES } as unknown as ReturnType<
      typeof useGetMailboxesInfoQuery
    >);

    const { result } = renderHook(() => useUnreadByMailbox());

    expect(result.current.unreadByMailbox).toStrictEqual(EXPECTED_UNREAD);
  });

  test('When mailboxes are not yet loaded, then the an empty object is returned', () => {
    mockUseGetMailboxesInfoQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<
      typeof useGetMailboxesInfoQuery
    >);

    const { result } = renderHook(() => useUnreadByMailbox());

    expect(result.current.unreadByMailbox).toStrictEqual({});
  });

  test('When options are provided, then they are forwarded to the query', () => {
    mockUseGetMailboxesInfoQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<
      typeof useGetMailboxesInfoQuery
    >);

    renderHook(() => useUnreadByMailbox({ pollingInterval: 30000 }));

    expect(mockUseGetMailboxesInfoQuery).toHaveBeenCalledWith(undefined, { pollingInterval: 30000 });
  });
});
