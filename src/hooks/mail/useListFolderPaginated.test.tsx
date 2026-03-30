import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import type { PropsWithChildren } from 'react';
import useListFolderPaginated from './useListFolderPaginated';
import { MailService } from '@/services/sdk/mail';
import { getMockedMails } from '@/test-utils/fixtures';
import { createTestStore } from '@/test-utils/createTestStore';
import { DEFAULT_FOLDER_LIMIT } from '@/constants';
import type { FolderType } from '@/types/mail';

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
};

describe('List Folder Paginated - custom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('When a folder is opened, then the first batch of emails is loaded and more are available', async () => {
    const page1 = getMockedMails(DEFAULT_FOLDER_LIMIT);
    page1.total = DEFAULT_FOLDER_LIMIT * 3;
    vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(page1);

    const store = createTestStore();
    const { result } = renderHook(() => useListFolderPaginated('inbox'), {
      wrapper: createWrapper(store),
    });

    waitFor(() => {
      expect(result.current.isLoadingListFolder).toBe(true);

      expect(result.current.listFolder?.emails).toHaveLength(DEFAULT_FOLDER_LIMIT);
      expect(result.current.hasMore).toBeTruthy();
    });
  });

  test('When all emails in the folder have been loaded, then no more are available', async () => {
    const page = getMockedMails(DEFAULT_FOLDER_LIMIT);
    page.total = DEFAULT_FOLDER_LIMIT;
    vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(page);

    const store = createTestStore();
    const { result } = renderHook(() => useListFolderPaginated('inbox'), {
      wrapper: createWrapper(store),
    });

    expect(result.current.hasMore).toBeFalsy();
  });

  test('When the user scrolls to the end of the list, then the next batch of emails is loaded and appended', async () => {
    const page1 = getMockedMails(DEFAULT_FOLDER_LIMIT);
    const page2 = getMockedMails(DEFAULT_FOLDER_LIMIT);
    page1.total = DEFAULT_FOLDER_LIMIT * 2;
    page2.total = DEFAULT_FOLDER_LIMIT * 2;

    vi.spyOn(MailService.instance, 'listFolder').mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const store = createTestStore();
    const { result } = renderHook(() => useListFolderPaginated('inbox'), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.onLoadMore();
    });

    waitFor(() => {
      expect(result.current.listFolder?.emails).toHaveLength(DEFAULT_FOLDER_LIMIT * 2);
      expect(result.current.listFolder?.emails).toStrictEqual([...page1.emails, ...page2.emails]);
      expect(result.current.hasMore).toBeFalsy();
    });
  });

  test('When the user scrolls while emails are still loading, then no duplicate request is made', async () => {
    const page1 = getMockedMails(DEFAULT_FOLDER_LIMIT);
    page1.total = DEFAULT_FOLDER_LIMIT * 2;
    const listFolderSpy = vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(page1);

    const store = createTestStore();
    const { result } = renderHook(() => useListFolderPaginated('inbox'), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.onLoadMore();
    });

    expect(listFolderSpy).toHaveBeenCalledTimes(1);
  });

  test('When the user navigates to a different folder, then only the emails from the new folder are shown', async () => {
    const inboxEmails = getMockedMails(DEFAULT_FOLDER_LIMIT);
    const sentEmails = getMockedMails(DEFAULT_FOLDER_LIMIT);
    inboxEmails.total = DEFAULT_FOLDER_LIMIT;
    sentEmails.total = DEFAULT_FOLDER_LIMIT;

    vi.spyOn(MailService.instance, 'listFolder').mockResolvedValueOnce(inboxEmails).mockResolvedValueOnce(sentEmails);

    const store = createTestStore();
    const { result, rerender } = renderHook(({ mailbox }) => useListFolderPaginated(mailbox), {
      initialProps: { mailbox: 'inbox' as FolderType },
      wrapper: createWrapper(store),
    });

    waitFor(() => {
      expect(result.current.listFolder?.emails).toStrictEqual(inboxEmails.emails);
    });

    rerender({ mailbox: 'sent' });

    waitFor(() => {
      expect(result.current.listFolder?.emails).toStrictEqual(sentEmails.emails);
      expect(result.current.listFolder?.emails).toHaveLength(DEFAULT_FOLDER_LIMIT);
    });
  });
});
