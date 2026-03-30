import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ErrorService } from '@/services/error';
import { FetchListFolderError, FetchMailboxesInfoError, FetchMessageError, UpdateMailError } from '@/errors';
import { MailService } from '@/services/sdk/mail';
import { getMockedMail, getMockedMailBoxes, getMockedMails } from '@/test-utils/fixtures';
import { mailApi } from '.';
import { DEFAULT_FOLDER_LIMIT } from '@/constants';
import type { ListEmailsQuery } from '@internxt/sdk';
import { createTestStore } from '@/test-utils/createTestStore';
import type { RootState } from '@/store';

vi.mock('@/services/error', () => ({
  ErrorService: {
    instance: {
      castError: vi.fn((err) => ({ message: err.message, requestId: 'req-123' })),
    },
  },
}));

describe('Mail Query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Get Mailboxes', () => {
    test('When getting the mailboxes, then it should return the list of mailboxes', async () => {
      const mockedMailboxes = getMockedMailBoxes();
      vi.spyOn(MailService.instance, 'getMailboxesInfo').mockResolvedValue(mockedMailboxes);

      const store = createTestStore();
      const result = await store.dispatch(mailApi.endpoints.getMailboxesInfo.initiate());

      expect(result.data).toStrictEqual(mockedMailboxes);
    });

    test('When getting the mailboxes fails, then an error indicating so is thrown', async () => {
      vi.spyOn(MailService.instance, 'getMailboxesInfo').mockRejectedValue(new Error('Network error'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');

      const store = createTestStore();
      const result = await store.dispatch(mailApi.endpoints.getMailboxesInfo.initiate());

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(FetchMailboxesInfoError);
    });
  });

  describe('Get Mail List Folder', () => {
    const query = {
      mailbox: 'inbox',
      limit: DEFAULT_FOLDER_LIMIT,
      position: 0,
    };

    test('When fetching the list of mails for a given folder, then it should return the list of emails', async () => {
      const listFolder = getMockedMails();
      const getListFolder = vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(listFolder);

      const store = createTestStore();
      const result = await store.dispatch(mailApi.endpoints.getListFolder.initiate(query as ListEmailsQuery));

      expect(result.data).toStrictEqual(listFolder);
      expect(getListFolder).toHaveBeenCalledWith(query);
    });

    test('When fetching the mails list fails, then an error indicating so is thrown', async () => {
      vi.spyOn(MailService.instance, 'listFolder').mockRejectedValue(new Error('Network error'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');

      const store = createTestStore();
      const result = await store.dispatch(mailApi.endpoints.getListFolder.initiate(query as ListEmailsQuery));

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(FetchListFolderError);
    });
  });

  describe('Get Mail Preview', () => {
    test('When fetching the mail data, then it should return the object containing the mail', async () => {
      const mockedMail = getMockedMail();
      const getLimitSpy = vi.spyOn(MailService.instance, 'getMessage').mockResolvedValue(mockedMail);

      const store = createTestStore();
      const result = await store.dispatch(mailApi.endpoints.getMailMessage.initiate({ emailId: mockedMail.id }));

      expect(result.data).toStrictEqual(mockedMail);
      expect(getLimitSpy).toHaveBeenCalledWith(mockedMail.id);
    });

    test('When fetching the mail data fails, then an error indicating so is thrown', async () => {
      const mockedMail = getMockedMail();
      vi.spyOn(MailService.instance, 'getMessage').mockRejectedValue(new Error('Unauthorized'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');

      const store = createTestStore();
      const result = await store.dispatch(mailApi.endpoints.getMailMessage.initiate({ emailId: mockedMail.id }));

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(FetchMessageError);
    });
  });

  describe('Mark Mail As Read', () => {
    const mailboxQuery = { mailbox: 'inbox', limit: DEFAULT_FOLDER_LIMIT, position: 0 } as ListEmailsQuery;

    const setupOptimisticStore = async () => {
      const mockedMails = getMockedMails();
      const mockedMailboxes = getMockedMailBoxes();
      const unreadEmail = { ...mockedMails.emails[0], isRead: false };
      mockedMails.emails[0] = unreadEmail;
      const inboxMailbox = { ...mockedMailboxes.find((m) => m.type === 'inbox')!, unreadEmails: 5 };

      vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(mockedMails);
      vi.spyOn(MailService.instance, 'getMailboxesInfo').mockResolvedValue(
        mockedMailboxes.map((m) => (m.type === 'inbox' ? inboxMailbox : m)),
      );

      const store = createTestStore();
      await store.dispatch(mailApi.endpoints.getListFolder.initiate(mailboxQuery));
      await store.dispatch(mailApi.endpoints.getMailboxesInfo.initiate());

      return { store, unreadEmail };
    };

    const getCacheState = (store: ReturnType<typeof createTestStore>) => {
      const rootState = store.getState() as unknown as RootState;
      return {
        listState: mailApi.endpoints.getListFolder.select(mailboxQuery)(rootState),
        mailboxState: mailApi.endpoints.getMailboxesInfo.select()(rootState),
      };
    };

    test('When marking a mail as read, then updateEmailStatus is called and returns null', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();

      const store = createTestStore();
      const result = await store.dispatch(
        mailApi.endpoints.markAsRead.initiate({ emailId: 'email-1', query: mailboxQuery }),
      );

      expect(result.data).toBeNull();
      expect(MailService.instance.updateEmailStatus).toHaveBeenCalledWith('email-1', { isRead: true });
    });

    test('When marking a mail as read, then the email is updated as read and unreadEmails is decremented optimistically', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const { store, unreadEmail } = await setupOptimisticStore();

      await store.dispatch(mailApi.endpoints.markAsRead.initiate({ emailId: unreadEmail.id, query: mailboxQuery }));

      const { listState, mailboxState } = getCacheState(store);
      expect(listState.data?.emails.find((m) => m.id === unreadEmail.id)?.isRead).toBeTruthy();
      expect(mailboxState.data?.find((m) => m.type === 'inbox')?.unreadEmails).toBe(4);
    });

    test('When marking a mail as read fails, then the optimistic updates are rolled back', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockRejectedValue(new Error('Server error'));
      const { store, unreadEmail } = await setupOptimisticStore();

      await store.dispatch(mailApi.endpoints.markAsRead.initiate({ emailId: unreadEmail.id, query: mailboxQuery }));

      const { listState, mailboxState } = getCacheState(store);
      expect(listState.data?.emails.find((m) => m.id === unreadEmail.id)?.isRead).toBeFalsy();
      expect(mailboxState.data?.find((m) => m.type === 'inbox')?.unreadEmails).toBe(5);
    });

    test('When marking a mail as read fails, then an UpdateMailError is thrown', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockRejectedValue(new Error('Unauthorized'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');

      const store = createTestStore();
      const result = await store.dispatch(
        mailApi.endpoints.markAsRead.initiate({ emailId: 'email-1', query: mailboxQuery }),
      );

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(UpdateMailError);
    });
  });
});
