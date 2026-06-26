import { describe, test, expect, vi, beforeEach } from 'vitest';
import { formatEmailsToList } from '.';
import { getMockedMails } from '@/test-utils/fixtures';
import { DateService } from '@/services/date';

vi.mock('@/services/date', () => ({
  DateService: {
    formatMailTimestamp: vi.fn((date: string) => date),
  },
}));

describe('Formatting emails to list format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('When there is no list, then nothing is returned', () => {
    expect(formatEmailsToList()).toBeUndefined();
  });

  test('When a list of emails is provided, then they are formatted and returned', () => {
    const { emails } = getMockedMails(3);
    const result = formatEmailsToList(emails);

    expect(result).toHaveLength(3);
    result?.forEach((item, i) => {
      expect(item.id).toBe(emails[i].id);
      expect(item.subject).toBe(emails[i].subject);
      expect(item.body).toBe(emails[i].preview);
      expect(item.read).toBe(emails[i].isRead);
      expect(item.from).toEqual(expect.arrayContaining([expect.objectContaining({ avatar: '' })]));
      expect(DateService.formatMailTimestamp).toHaveBeenCalledWith(emails[0].receivedAt);
    });
  });

  test('When the row carries thread participants, then those are used instead of the message sender', () => {
    const { emails } = getMockedMails(1);
    emails[0].from = [{ email: 'alice@inxt.me', name: 'Alice' }];
    (emails[0] as { participants?: { email: string; name?: string }[] }).participants = [
      { email: 'alice@inxt.me', name: 'Alice' },
      { email: 'bob@inxt.me', name: 'Bob' },
    ];

    const result = formatEmailsToList(emails);

    expect(result?.[0].from.map((p) => p.name)).toEqual(['Alice', 'Bob']);
  });

  test('When the row has no participants, then the message sender is used as fallback', () => {
    const { emails } = getMockedMails(1);
    emails[0].from = [{ email: 'alice@inxt.me', name: 'Alice' }];
    delete (emails[0] as { participants?: unknown }).participants;

    const result = formatEmailsToList(emails);

    expect(result?.[0].from.map((p) => p.name)).toEqual(['Alice']);
  });

  test('When a row is encrypted, then it uses the decrypted preview when available and never the ciphertext', () => {
    const { emails } = getMockedMails(2);
    emails.forEach((e) => {
      (e as { encryption?: unknown }).encryption = { encryptedPreview: 'ep', wrappedKeys: [] };
    });

    const result = formatEmailsToList(emails, { [emails[0].id]: 'decrypted snippet' });

    expect(result?.[0].body).toBe('decrypted snippet');
    expect(result?.[1].body).toBe('');
    expect(result?.[1].body).not.toBe(emails[1].preview);
  });
});
