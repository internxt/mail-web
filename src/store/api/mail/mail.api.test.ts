import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ErrorService } from '@/services/error';
import {
  DeleteEmailError,
  FetchListFolderError,
  FetchMailAccountKeysError,
  FetchMailboxesInfoError,
  FetchMessageError,
  MAIL_NOT_SETUP_CODE,
  MailNotSetupError,
  UpdateMailError,
} from '@/errors';
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

const mailboxQuery = { mailbox: 'inbox', limit: DEFAULT_FOLDER_LIMIT } as ListEmailsQuery;

const setupCachedStore = async (emailOverrides?: Record<string, unknown>) => {
  const mockedMails = getMockedMails();
  const mockedMailboxes = getMockedMailBoxes();
  const targetEmail = { ...mockedMails.emails[0], isRead: false, ...emailOverrides };
  mockedMails.emails[0] = targetEmail;
  const inboxMailbox = { ...mockedMailboxes.find((m) => m.type === 'inbox')!, unreadEmails: 5 };

  vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(mockedMails);
  vi.spyOn(MailService.instance, 'getMailboxesInfo').mockResolvedValue(
    mockedMailboxes.map((m) => (m.type === 'inbox' ? inboxMailbox : m)),
  );

  const store = createTestStore();
  await store.dispatch(mailApi.endpoints.getListFolder.initiate(mailboxQuery));
  await store.dispatch(mailApi.endpoints.getMailboxesInfo.initiate());

  return { store, mockedMails, targetEmail };
};

const getCacheState = (store: ReturnType<typeof createTestStore>) => {
  const rootState = store.getState() as unknown as RootState;
  return {
    listState: mailApi.endpoints.getListFolder.select(mailboxQuery)(rootState),
    mailboxState: mailApi.endpoints.getMailboxesInfo.select()(rootState),
  };
};

describe('Mail API', () => {
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

    test('When a second batch of emails is loaded, then it is appended to the existing ones', async () => {
      const page1 = getMockedMails(DEFAULT_FOLDER_LIMIT);
      const page2 = getMockedMails(DEFAULT_FOLDER_LIMIT);
      page1.total = DEFAULT_FOLDER_LIMIT * 2;
      page2.total = DEFAULT_FOLDER_LIMIT * 2;
      vi.spyOn(MailService.instance, 'listFolder').mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
      const store = createTestStore();

      await store.dispatch(mailApi.endpoints.getListFolder.initiate(query as ListEmailsQuery));
      await store.dispatch(
        mailApi.endpoints.getListFolder.initiate({ ...query, anchorId: 'anchor-page-2' } as ListEmailsQuery),
      );

      const state = store.getState() as unknown as RootState;
      const cache = mailApi.endpoints.getListFolder.select(query as ListEmailsQuery)(state);
      expect(cache.data?.emails).toHaveLength(DEFAULT_FOLDER_LIMIT * 2);
      expect(cache.data?.emails).toEqual([...page1.emails, ...page2.emails]);
    });

    test('When the folder is reloaded from the beginning, then the existing emails are replaced not accumulated', async () => {
      const firstLoad = getMockedMails(DEFAULT_FOLDER_LIMIT);
      const reload = getMockedMails(DEFAULT_FOLDER_LIMIT);
      firstLoad.total = DEFAULT_FOLDER_LIMIT;
      reload.total = DEFAULT_FOLDER_LIMIT;
      vi.spyOn(MailService.instance, 'listFolder').mockResolvedValueOnce(firstLoad).mockResolvedValueOnce(reload);
      const store = createTestStore();

      await store.dispatch(mailApi.endpoints.getListFolder.initiate(query as ListEmailsQuery));
      await store.dispatch(mailApi.endpoints.getListFolder.initiate(query as ListEmailsQuery, { forceRefetch: true }));

      const state = store.getState() as unknown as RootState;
      const cache = mailApi.endpoints.getListFolder.select(query as ListEmailsQuery)(state);
      expect(cache.data?.emails).toHaveLength(DEFAULT_FOLDER_LIMIT);
      expect(cache.data?.emails).toStrictEqual(reload.emails);
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

  describe('Update Read Status', () => {
    test('When marking a mail as read, then it should call the service and return null', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const store = createTestStore();

      const result = await store.dispatch(
        mailApi.endpoints.updateReadStatus.initiate({ emailId: 'email-1', mailbox: 'inbox', isRead: true }),
      );

      expect(result.data).toBeNull();
      expect(MailService.instance.updateEmailStatus).toHaveBeenCalledWith('email-1', { isRead: true });
    });

    test('When marking an unread mail as read, then the email and unread count are updated optimistically', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const { store, targetEmail } = await setupCachedStore({ isRead: false });

      await store.dispatch(
        mailApi.endpoints.updateReadStatus.initiate({ emailId: targetEmail.id, mailbox: 'inbox', isRead: true }),
      );

      const { listState, mailboxState } = getCacheState(store);
      expect(listState.data?.emails.find((m) => m.id === targetEmail.id)?.isRead).toBe(true);
      expect(mailboxState.data?.find((m) => m.type === 'inbox')?.unreadEmails).toBe(4);
    });

    test('When marking an already-read mail as read again, then the unread count is not changed', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const { store, targetEmail } = await setupCachedStore({ isRead: true });

      await store.dispatch(
        mailApi.endpoints.updateReadStatus.initiate({ emailId: targetEmail.id, mailbox: 'inbox', isRead: true }),
      );

      const { mailboxState } = getCacheState(store);
      expect(mailboxState.data?.find((m) => m.type === 'inbox')?.unreadEmails).toBe(5);
    });

    test('When marking a mail as read fails, then the optimistic updates are rolled back', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockRejectedValue(new Error('Server error'));
      const { store, targetEmail } = await setupCachedStore({ isRead: false });

      await store.dispatch(
        mailApi.endpoints.updateReadStatus.initiate({ emailId: targetEmail.id, mailbox: 'inbox', isRead: true }),
      );

      const { listState, mailboxState } = getCacheState(store);
      expect(listState.data?.emails.find((m) => m.id === targetEmail.id)?.isRead).toBe(false);
      expect(mailboxState.data?.find((m) => m.type === 'inbox')?.unreadEmails).toBe(5);
    });

    test('When marking a mail as read fails, then an error indicating so is thrown', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockRejectedValue(new Error('Unauthorized'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');
      const store = createTestStore();

      const result = await store.dispatch(
        mailApi.endpoints.updateReadStatus.initiate({ emailId: 'email-1', mailbox: 'inbox', isRead: true }),
      );

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(UpdateMailError);
    });
  });

  describe('Move To Folder', () => {
    const sourceMailbox = 'inbox' as const;
    const targetMailbox = 'trash' as const;
    const mailboxQuery = { mailbox: sourceMailbox, limit: DEFAULT_FOLDER_LIMIT } as ListEmailsQuery;

    const setupCachedStore = async () => {
      const mockedMails = getMockedMails(3);
      mockedMails.emails[0].isRead = false;
      mockedMails.emails[1].isRead = false;
      mockedMails.emails[2].isRead = true;
      const mockedMailboxes = getMockedMailBoxes();
      const inboxMailbox = { ...mockedMailboxes.find((m) => m.type === sourceMailbox)!, unreadEmails: 2 };

      vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(mockedMails);
      vi.spyOn(MailService.instance, 'getMailboxesInfo').mockResolvedValue(
        mockedMailboxes.map((m) => (m.type === sourceMailbox ? inboxMailbox : m)),
      );

      const store = createTestStore();
      await store.dispatch(mailApi.endpoints.getListFolder.initiate(mailboxQuery));
      await store.dispatch(mailApi.endpoints.getMailboxesInfo.initiate());

      return { store, mockedMails };
    };

    const getCacheState = (store: ReturnType<typeof createTestStore>) => {
      const rootState = store.getState() as unknown as RootState;
      return {
        listState: mailApi.endpoints.getListFolder.select(mailboxQuery)(rootState),
        mailboxState: mailApi.endpoints.getMailboxesInfo.select()(rootState),
      };
    };

    test('When moving emails to another folder, then it should call the service and return null', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const store = createTestStore();

      const result = await store.dispatch(
        mailApi.endpoints.moveToFolder.initiate({ emailIds: ['email-1'], sourceMailbox, targetMailbox }),
      );

      expect(result.data).toBeNull();
      expect(MailService.instance.updateEmailStatus).toHaveBeenCalledWith('email-1', { mailbox: targetMailbox });
    });

    test('When moving emails to another folder, then they are removed from the source folder optimistically', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const { store, mockedMails } = await setupCachedStore();
      const [first, second] = mockedMails.emails;

      await store.dispatch(
        mailApi.endpoints.moveToFolder.initiate({
          emailIds: [first.id, second.id],
          sourceMailbox,
          targetMailbox,
        }),
      );

      const { listState } = getCacheState(store);
      expect(listState.data?.emails).toHaveLength(1);
      expect(listState.data?.emails.find((m) => m.id === first.id)).toBeUndefined();
      expect(listState.data?.emails.find((m) => m.id === second.id)).toBeUndefined();
    });

    test('When moving only the unread emails, then the unread count is decremented by the number of unread emails moved', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const { store, mockedMails } = await setupCachedStore();
      const unreadIds = mockedMails.emails.filter((m) => !m.isRead).map((m) => m.id);

      await store.dispatch(
        mailApi.endpoints.moveToFolder.initiate({ emailIds: unreadIds, sourceMailbox, targetMailbox }),
      );

      const { mailboxState } = getCacheState(store);
      expect(mailboxState.data?.find((m) => m.type === sourceMailbox)?.unreadEmails).toBe(0);
    });

    test('When moving a mix of read and unread emails, then only the unread ones are deducted from the count', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockResolvedValue();
      const { store, mockedMails } = await setupCachedStore();
      const allIds = mockedMails.emails.map((m) => m.id);

      await store.dispatch(mailApi.endpoints.moveToFolder.initiate({ emailIds: allIds, sourceMailbox, targetMailbox }));

      const { mailboxState } = getCacheState(store);
      expect(mailboxState.data?.find((m) => m.type === sourceMailbox)?.unreadEmails).toBe(0);
    });

    test('When moving emails fails, then the source folder and mailbox counts are rolled back', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockRejectedValue(new Error('Server error'));
      const { store, mockedMails } = await setupCachedStore();
      const emailIds = mockedMails.emails.map((m) => m.id);

      await store.dispatch(mailApi.endpoints.moveToFolder.initiate({ emailIds, sourceMailbox, targetMailbox }));

      const { listState, mailboxState } = getCacheState(store);
      expect(listState.data?.emails).toHaveLength(3);
      expect(mailboxState.data?.find((m) => m.type === sourceMailbox)?.unreadEmails).toBe(2);
    });

    test('When moving emails fails, then an error indicating so is thrown', async () => {
      vi.spyOn(MailService.instance, 'updateEmailStatus').mockRejectedValue(new Error('Server error'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');
      const store = createTestStore();

      const result = await store.dispatch(
        mailApi.endpoints.moveToFolder.initiate({ emailIds: ['email-1'], sourceMailbox, targetMailbox }),
      );

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(UpdateMailError);
    });
  });

  describe('Delete Mails', () => {
    const sourceMailbox = 'inbox' as const;
    const mailboxQuery = { mailbox: sourceMailbox, limit: DEFAULT_FOLDER_LIMIT } as ListEmailsQuery;

    const setupCachedStore = async () => {
      const mockedMails = getMockedMails(3);
      mockedMails.emails[0].isRead = false;
      mockedMails.emails[1].isRead = false;
      mockedMails.emails[2].isRead = true;
      const mockedMailboxes = getMockedMailBoxes();
      const inboxMailbox = { ...mockedMailboxes.find((m) => m.type === sourceMailbox)!, unreadEmails: 2 };

      vi.spyOn(MailService.instance, 'listFolder').mockResolvedValue(mockedMails);
      vi.spyOn(MailService.instance, 'getMailboxesInfo').mockResolvedValue(
        mockedMailboxes.map((m) => (m.type === sourceMailbox ? inboxMailbox : m)),
      );

      const store = createTestStore();
      await store.dispatch(mailApi.endpoints.getListFolder.initiate(mailboxQuery));
      await store.dispatch(mailApi.endpoints.getMailboxesInfo.initiate());

      return { store, mockedMails };
    };

    const getCacheState = (store: ReturnType<typeof createTestStore>) => {
      const rootState = store.getState() as unknown as RootState;
      return {
        listState: mailApi.endpoints.getListFolder.select(mailboxQuery)(rootState),
        mailboxState: mailApi.endpoints.getMailboxesInfo.select()(rootState),
      };
    };

    test('When deleting emails, then it should call the service and return null', async () => {
      vi.spyOn(MailService.instance, 'trashEmail').mockResolvedValue();
      const store = createTestStore();

      const result = await store.dispatch(
        mailApi.endpoints.deleteMails.initiate({ emailIds: ['email-1'], sourceMailbox }),
      );

      expect(result.data).toBeNull();
      expect(MailService.instance.trashEmail).toHaveBeenCalledWith('email-1');
    });

    test('When deleting emails, then they are removed from the folder optimistically', async () => {
      vi.spyOn(MailService.instance, 'trashEmail').mockResolvedValue();
      const { store, mockedMails } = await setupCachedStore();
      const [first, second] = mockedMails.emails;

      await store.dispatch(mailApi.endpoints.deleteMails.initiate({ emailIds: [first.id, second.id], sourceMailbox }));

      const { listState } = getCacheState(store);
      expect(listState.data?.emails).toHaveLength(1);
      expect(listState.data?.emails.find((m) => m.id === first.id)).toBeUndefined();
      expect(listState.data?.emails.find((m) => m.id === second.id)).toBeUndefined();
    });

    test('When deleting only unread emails, then the unread count is decremented by the number of unread emails deleted', async () => {
      vi.spyOn(MailService.instance, 'trashEmail').mockResolvedValue();
      const { store, mockedMails } = await setupCachedStore();
      const unreadIds = mockedMails.emails.filter((m) => !m.isRead).map((m) => m.id);

      await store.dispatch(mailApi.endpoints.deleteMails.initiate({ emailIds: unreadIds, sourceMailbox }));

      const { mailboxState } = getCacheState(store);
      expect(mailboxState.data?.find((m) => m.type === sourceMailbox)?.unreadEmails).toBe(0);
    });

    test('When deleting a mix of read and unread emails, then only the unread ones are deducted from the count', async () => {
      vi.spyOn(MailService.instance, 'trashEmail').mockResolvedValue();
      const { store, mockedMails } = await setupCachedStore();
      const allIds = mockedMails.emails.map((m) => m.id);

      await store.dispatch(mailApi.endpoints.deleteMails.initiate({ emailIds: allIds, sourceMailbox }));

      const { mailboxState } = getCacheState(store);
      expect(mailboxState.data?.find((m) => m.type === sourceMailbox)?.unreadEmails).toBe(0);
    });

    test('When deleting emails fails, then the folder and mailbox counts are rolled back', async () => {
      vi.spyOn(MailService.instance, 'trashEmail').mockRejectedValue(new Error('Server error'));
      const { store, mockedMails } = await setupCachedStore();
      const emailIds = mockedMails.emails.map((m) => m.id);

      await store.dispatch(mailApi.endpoints.deleteMails.initiate({ emailIds, sourceMailbox }));

      const { listState, mailboxState } = getCacheState(store);
      expect(listState.data?.emails).toHaveLength(3);
      expect(mailboxState.data?.find((m) => m.type === sourceMailbox)?.unreadEmails).toBe(2);
    });

    test('When deleting emails fails, then an error indicating so is thrown', async () => {
      vi.spyOn(MailService.instance, 'trashEmail').mockRejectedValue(new Error('Server error'));
      const castErrorSpy = vi.spyOn(ErrorService.instance, 'castError');
      const store = createTestStore();

      const result = await store.dispatch(
        mailApi.endpoints.deleteMails.initiate({ emailIds: ['email-1'], sourceMailbox }),
      );

      expect(castErrorSpy).toHaveBeenCalledOnce();
      expect(result.error).toBeInstanceOf(DeleteEmailError);
    });
  });

  describe('Get Mail Account Keys', () => {
    const address = 'jane@inxt.me';
    const mockKeys = {
      address,
      publicKey: 'pub',
      encryptionPrivateKey: 'enc',
      recoveryPrivateKey: 'rec',
      salt: 'salt',
    };

    test('When fetching the mail account keys, then it should return the keys', async () => {
      vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
      const store = createTestStore();

      const result = await store.dispatch(mailApi.endpoints.getMailAccountKeys.initiate({ address }));

      expect(result.data).toStrictEqual(mockKeys);
    });

    test('When the user has not set up a mail account, then a MailNotSetupError should be returned', async () => {
      vi.spyOn(MailService.instance, 'getMailAccountKeys').mockRejectedValue(new Error('Forbidden'));
      vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
        message: 'Mail account has not been set up',
        status: 403,
        code: MAIL_NOT_SETUP_CODE,
        requestId: 'req-123',
      } as never);
      const store = createTestStore();

      const result = await store.dispatch(mailApi.endpoints.getMailAccountKeys.initiate({ address }));

      expect(result.error).toBeInstanceOf(MailNotSetupError);
    });

    test('When the keys request fails for another reason, then a generic fetch error should be returned', async () => {
      vi.spyOn(MailService.instance, 'getMailAccountKeys').mockRejectedValue(new Error('Network error'));
      vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
        message: 'Network error',
        status: 500,
        requestId: 'req-123',
      } as never);
      const store = createTestStore();

      const result = await store.dispatch(mailApi.endpoints.getMailAccountKeys.initiate({ address }));

      expect(result.error).toBeInstanceOf(FetchMailAccountKeysError);
    });
  });
});
