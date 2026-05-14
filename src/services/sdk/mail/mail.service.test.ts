/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { SdkManager } from '..';
import { MailService } from '.';
import { getMockedMails, getMockedMailBoxes, getMockedMail } from '@/test-utils/fixtures';
import type { MailAccountResponse, SetupMailAccountPayload } from '@internxt/sdk/dist/mail/types';

describe('Mail Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Get me', () => {
    test('When fetching the mail account and it is active, then the account should be returned', async () => {
      const mockAccount: MailAccountResponse = {
        id: 'account-1',
        defaultAddress: 'jane@inxt.me',
        status: 'active',
      };
      const mockMailClient = {
        getMailAccount: vi.fn().mockResolvedValue(mockAccount),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.getMe();

      expect(result).toStrictEqual(mockAccount);
      expect(mockMailClient.getMailAccount).toHaveBeenCalledOnce();
    });

    test('When fetching the mail account and it is suspended, then its scheduled deletion date and suspension date should be present', async () => {
      const mockAccount: MailAccountResponse = {
        id: 'account-1',
        defaultAddress: 'jane@inxt.me',
        status: 'suspended',
        suspendedAt: '2026-05-01T00:00:00.000Z',
        deletionAt: '2026-06-01T00:00:00.000Z',
      };
      const mockMailClient = {
        getMailAccount: vi.fn().mockResolvedValue(mockAccount),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.getMe();

      expect(result).toStrictEqual(mockAccount);
    });

    test('When fetching the mail account fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unauthorized');
      const mockMailClient = {
        getMailAccount: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.getMe()).rejects.toThrow(unexpectedError);
    });
  });

  describe('Get mailboxes info', () => {
    test('When fetching mailboxes, then all mailboxes should be returned', async () => {
      const mockedMailboxes = getMockedMailBoxes();

      const mockMailClient = {
        getMailboxes: vi.fn().mockResolvedValue(mockedMailboxes),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.getMailboxesInfo();

      expect(result).toStrictEqual(mockedMailboxes);
    });

    test('When fetching mailboxes fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockMailClient = {
        getMailboxes: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.getMailboxesInfo()).rejects.toThrow(unexpectedError);
    });
  });

  describe('List folder', () => {
    test('When listing a folder, then the emails should be returned', async () => {
      const mockedEmails = getMockedMails(5);
      const query = { mailboxId: 'inbox', limit: 10, offset: 0 };

      const mockMailClient = {
        listEmails: vi.fn().mockResolvedValue(mockedEmails),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.listFolder(query);

      expect(result).toStrictEqual(mockedEmails);
      expect(mockMailClient.listEmails).toHaveBeenCalledWith(query);
    });

    test('When listing a folder without query params, then all emails should be returned', async () => {
      const mockedEmails = getMockedMails();

      const mockMailClient = {
        listEmails: vi.fn().mockResolvedValue(mockedEmails),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.listFolder();

      expect(result).toStrictEqual(mockedEmails);
      expect(mockMailClient.listEmails).toHaveBeenCalledWith(undefined);
    });

    test('When listing a folder fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockMailClient = {
        listEmails: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.listFolder()).rejects.toThrow(unexpectedError);
    });
  });

  describe('Update email status', () => {
    test('When updating an email status, then the client should be called with the correct params', async () => {
      const emailId = 'email-123';
      const status = { isRead: true };

      const mockMailClient = {
        updateEmail: vi.fn().mockResolvedValue(undefined),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await MailService.instance.updateEmailStatus(emailId, status);

      expect(mockMailClient.updateEmail).toHaveBeenCalledWith(emailId, status);
    });

    test('When updating an email status fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockMailClient = {
        updateEmail: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.updateEmailStatus('email-123', { isRead: true })).rejects.toThrow(
        unexpectedError,
      );
    });
  });

  describe('Get mail message', () => {
    test('When getting a mail message, then the client should be called with the correct params', async () => {
      const mockedMessage = getMockedMail();

      const mockMailClient = {
        getEmail: vi.fn().mockResolvedValue(mockedMessage),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.getMessage(mockedMessage.id);

      expect(result).toStrictEqual(mockedMessage);
      expect(mockMailClient.getEmail).toHaveBeenCalledWith(mockedMessage.id);
    });

    test('When getting a mail message fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockMailClient = {
        getEmail: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.getMessage('email-123')).rejects.toThrow(unexpectedError);
    });
  });

  describe('Setup mail account', () => {
    const payload: SetupMailAccountPayload = {
      address: 'jane',
      displayName: 'Jane Doe',
      domain: 'internxt.com',
      password: 'encrypted-password',
      keys: {
        publicKey: 'public-key',
        encryptionPrivateKey: 'encryption-private-key',
        recoveryPrivateKey: 'recovery-private-key',
      },
    };

    test('When setting up a mail account, then the created account should be returned', async () => {
      const mockResponse = { address: 'jane@internxt.com' };
      const mockMailClient = {
        setupMailAccount: vi.fn().mockResolvedValue(mockResponse),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.setupMailAccount(payload);

      expect(result).toStrictEqual(mockResponse);
      expect(mockMailClient.setupMailAccount).toHaveBeenCalledWith(payload);
    });

    test('When the mail account setup fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');
      const mockMailClient = {
        setupMailAccount: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.setupMailAccount(payload)).rejects.toThrow(unexpectedError);
    });
  });

  describe('Search emails', () => {
    test('When searching emails, then the client should be called with the correct params', async () => {
      const mockedEmails = getMockedMails(5);
      const query = { mailboxId: 'inbox', limit: 10, offset: 0 };

      const mockMailClient = {
        search: vi.fn().mockResolvedValue(mockedEmails),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.search(query);

      expect(result).toStrictEqual(mockedEmails);
      expect(mockMailClient.search).toHaveBeenCalledWith(query);
    });

    test('When searching emails fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockMailClient = {
        search: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.search({})).rejects.toThrow(unexpectedError);
    });
  });

  describe('Get mail account keys', () => {
    test('When fetching keys for an address, then the keys should be returned', async () => {
      const address = 'jane@internxt.com';
      const mockKeys = {
        address,
        publicKey: 'pub',
        encryptionPrivateKey: 'enc',
        recoveryPrivateKey: 'rec',
      };

      const mockMailClient = {
        getMailAccountKeys: vi.fn().mockResolvedValue(mockKeys),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.getMailAccountKeys(address);

      expect(result).toStrictEqual(mockKeys);
      expect(mockMailClient.getMailAccountKeys).toHaveBeenCalledWith(address);
    });

    test('When fetching keys without an address, then the client should be called without one', async () => {
      const mockKeys = {
        address: 'jane@internxt.com',
        publicKey: 'pub',
        encryptionPrivateKey: 'enc',
        recoveryPrivateKey: 'rec',
      };
      const mockMailClient = {
        getMailAccountKeys: vi.fn().mockResolvedValue(mockKeys),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      const result = await MailService.instance.getMailAccountKeys();

      expect(result).toStrictEqual(mockKeys);
      expect(mockMailClient.getMailAccountKeys).toHaveBeenCalledWith(undefined);
    });

    test('When fetching keys fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');
      const mockMailClient = {
        getMailAccountKeys: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.getMailAccountKeys('jane@internxt.com')).rejects.toThrow(unexpectedError);
    });
  });

  describe('Trashing email', () => {
    test('When trashing email, then the client should be called with the correct params', async () => {
      const mockMailClient = {
        deleteEmail: vi.fn().mockResolvedValue(undefined),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await MailService.instance.trashEmail('email-1');

      expect(mockMailClient.deleteEmail).toHaveBeenCalledWith('email-1');
    });

    test('When trashing an email fails, then an error should be thrown', async () => {
      const unexpectedError = new Error('Unexpected error');

      const mockMailClient = {
        deleteEmail: vi.fn().mockRejectedValue(unexpectedError),
      } as any;
      vi.spyOn(SdkManager.instance, 'getMail').mockReturnValue(mockMailClient);

      await expect(MailService.instance.trashEmail('email-1')).rejects.toThrow(unexpectedError);
    });
  });
});
