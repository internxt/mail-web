/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { SdkManager } from '..';
import { MailService } from '.';
import { getMockedMails, getMockedMailBoxes } from '@/test-utils/fixtures';

describe('Mail Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
