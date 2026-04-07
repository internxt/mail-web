import { describe, expect, test, vi, beforeEach } from 'vitest';
import { EmailRepository } from './';
import { CryptoEmail } from '../crypto';
import type { StoredEmail } from '../../types';
import type { DatabaseService } from '../..';

vi.stubGlobal('IDBKeyRange', {
  bound: (lower: unknown, upper: unknown) => ({ lower, upper }),
});

const makeEmail = (overrides: Partial<StoredEmail> = {}): StoredEmail => ({
  id: 'email-1',
  mail: { subject: 'Hello', body: 'World' },
  params: {
    isRead: false,
    receivedAt: new Date('2024-01-15').toISOString(),
    from: [{ email: 'alice@example.com', name: 'Alice' }],
    to: [{ email: 'bob@example.com', name: 'Bob' }],
    hasAttachment: false,
  },
  ...overrides,
});

const makeMockDb = () => ({
  put: vi.fn().mockResolvedValue(undefined),
  putMany: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  getByIndex: vi.fn().mockResolvedValue([]),
  getByRange: vi.fn().mockResolvedValue([]),
  getByFolder: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(0),
  getBatch: vi.fn().mockResolvedValue({ items: [], nextCursor: undefined }),
  deleteOldest: vi.fn().mockResolvedValue(undefined),
});

const crypto = new CryptoEmail(new Uint8Array(32));

describe('Email Repository', () => {
  let db: ReturnType<typeof makeMockDb>;
  let repo: EmailRepository;

  beforeEach(() => {
    db = makeMockDb();
    repo = new EmailRepository(db as unknown as DatabaseService, crypto);
  });

  describe('Add email', () => {
    test('When adding an email, then it is stored encrypted', async () => {
      const email = makeEmail();

      await repo.add(email);

      const stored = db.put.mock.calls[0][0] as StoredEmail;
      expect(stored.id).toBe(email.id);
      expect(stored.mail.subject).not.toBe(email.mail.subject);
      expect(stored.mail.body).not.toBe(email.mail.body);
    });
  });

  describe('Add multiple emails', () => {
    test('When adding multiple emails, then all are stored encrypted', async () => {
      const emails = [makeEmail({ id: '1' }), makeEmail({ id: '2' })];

      await repo.addMany(emails);

      const stored = db.putMany.mock.calls[0][0] as StoredEmail[];
      expect(stored).toHaveLength(2);
      for (const s of stored) {
        expect(s.mail.subject).not.toBe('Hello');
      }
    });
  });

  describe('Get email by Id', () => {
    test('When getting an existing email, then it is returned decrypted', async () => {
      const email = makeEmail();
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.get.mockResolvedValue(encrypted);

      const result = await repo.getById(email.id);

      expect(result.mail.subject).toBe(email.mail.subject);
      expect(result.mail.body).toBe(email.mail.body);
    });

    test('When getting a non-existent email, then it throws', async () => {
      db.get.mockResolvedValue(undefined);

      await expect(repo.getById('missing')).rejects.toThrow('Email missing not found');
    });
  });

  describe('Get email by folder', () => {
    test('When getting emails by folder, then they are returned decrypted', async () => {
      const email = makeEmail({ params: { ...makeEmail().params, folderId: ['inbox'] } });
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getByFolder.mockResolvedValue([encrypted]);

      const result = await repo.getByFolder('inbox');

      expect(result).toHaveLength(1);
      expect(result[0].mail.subject).toBe(email.mail.subject);
    });

    test('When folder is empty, then it returns an empty array', async () => {
      db.getByFolder.mockResolvedValue([]);

      const result = await repo.getByFolder('inbox');

      expect(result).toEqual([]);
    });
  });

  describe('Get latest email in folder', () => {
    test('When folder has emails, then the latest is returned decrypted', async () => {
      const email = makeEmail();
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getByFolder.mockResolvedValue([encrypted]);

      const result = await repo.getLatestInFolder('inbox');

      expect(result?.mail.subject).toBe(email.mail.subject);
    });

    test('When folder is empty, then it returns undefined', async () => {
      db.getByFolder.mockResolvedValue([]);

      const result = await repo.getLatestInFolder('inbox');

      expect(result).toBeUndefined();
    });
  });

  describe('Get all emails', () => {
    test('When there are emails, then all are returned decrypted', async () => {
      const email = makeEmail();
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getAll.mockResolvedValue([encrypted]);

      const result = await repo.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].mail.subject).toBe(email.mail.subject);
    });
  });

  describe('Remove an email', () => {
    test('When removing an email, then it is deleted from db', async () => {
      await repo.remove('email-1');

      expect(db.remove).toHaveBeenCalledWith('email-1');
    });
  });

  describe('Count all emails', () => {
    test('When counting, then it returns the db count', async () => {
      db.count.mockResolvedValue(5);

      const result = await repo.count();

      expect(result).toBe(5);
    });
  });

  describe('Enforce max', () => {
    test('When count is below max, then nothing is deleted', async () => {
      db.count.mockResolvedValue(3);

      await repo.enforceMax(5);

      expect(db.deleteOldest).not.toHaveBeenCalled();
    });

    test('When count exceeds max, then oldest are deleted', async () => {
      db.count.mockResolvedValue(8);

      await repo.enforceMax(5);

      expect(db.deleteOldest).toHaveBeenCalledWith(3);
    });
  });

  describe('Get batch', () => {
    test('When getting a batch, then emails are returned decrypted', async () => {
      const email = makeEmail();
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getBatch.mockResolvedValue({ items: [encrypted], nextCursor: 'cursor-1' });

      const { emails, nextCursor } = await repo.getBatch(10);

      expect(emails).toHaveLength(1);
      expect(emails[0].mail.subject).toBe(email.mail.subject);
      expect(nextCursor).toBe('cursor-1');
    });
  });

  describe('Search an email', () => {
    test('When filtering by read/unread, then only matching emails are returned', async () => {
      const read = makeEmail({ id: '1', params: { ...makeEmail().params, isRead: true } });
      const unread = makeEmail({ id: '2', params: { ...makeEmail().params, isRead: false } });
      const encryptedRead = { ...read, mail: await crypto.encrypt(read.mail) };
      const encryptedUnread = { ...unread, mail: await crypto.encrypt(unread.mail) };
      db.getAll.mockResolvedValue([encryptedRead, encryptedUnread]);

      const result = await repo.search({ isRead: true });

      expect(result).toHaveLength(1);
      expect(result[0].params.isRead).toBe(true);
    });

    test('When filtering by from, then only emails from matching sender are returned', async () => {
      const email = makeEmail();
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getByIndex.mockResolvedValue([encrypted]);

      const result = await repo.search({ from: 'alice' });

      expect(result).toHaveLength(1);
      expect(db.getByIndex).toHaveBeenCalledWith('byFrom', 'alice');
    });

    test('When filtering by from with no match, then empty array is returned', async () => {
      const email = makeEmail({ params: { ...makeEmail().params, from: [{ email: 'other@example.com' }] } });
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getByIndex.mockResolvedValue([encrypted]);

      const result = await repo.search({ from: 'alice' });

      expect(result).toHaveLength(0);
    });

    test('When filtering by date, then only emails in range are returned', async () => {
      const inRange = makeEmail({
        id: '1',
        params: { ...makeEmail().params, receivedAt: new Date('2024-01-15').toISOString() },
      });
      const outOfRange = makeEmail({
        id: '2',
        params: { ...makeEmail().params, receivedAt: new Date('2024-03-01').toISOString() },
      });
      const encIn = { ...inRange, mail: await crypto.encrypt(inRange.mail) };
      const encOut = { ...outOfRange, mail: await crypto.encrypt(outOfRange.mail) };
      db.getByRange.mockResolvedValue([encIn, encOut]);

      const after = new Date('2024-01-01').getTime();
      const before = new Date('2024-02-01').getTime();
      const result = await repo.search({ dateRange: { after, before } });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    test('When filtering by attachment, then only emails with that type are returned', async () => {
      const email = makeEmail({ params: { ...makeEmail().params, hasAttachment: true, attachmentTypes: ['pdf'] } });
      const encrypted = { ...email, mail: await crypto.encrypt(email.mail) };
      db.getByIndex.mockResolvedValue([encrypted]);

      const result = await repo.search({ attachmentType: 'pdf' });

      expect(result).toHaveLength(1);
    });
  });
});
