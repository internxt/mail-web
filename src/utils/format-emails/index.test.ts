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
      expect(item.from.avatar).toBe('');
      expect(DateService.formatMailTimestamp).toHaveBeenCalledWith(emails[0].receivedAt);
    });
  });
});
