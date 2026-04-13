import { describe, expect, test, vi, beforeEach } from 'vitest';
import { EmailRepository } from './';
import { CryptoEmail } from '../crypto';
import { EMAIL_DB_INDEXES_KEYS, type StoredEmail } from '../../types';
import type { DatabaseService } from '../..';
import { EmailNotFoundError } from '@/errors';

vi.stubGlobal('IDBKeyRange', {
  bound: (lower: unknown, upper: unknown) => ({ lower, upper }),
});

const FIXED_KEY = new Uint8Array(32);
const STORE = 'emails';

const makeEmail = (overrides: Partial<StoredEmail> = {}): StoredEmail => ({
  id: 'email-1',
  mail: { subject: 'Hello', body: 'World' },
  params: {
    isRead: false,
    receivedAt: new Date('2024-01-15').toISOString(),
    from: [{ email: 'alice@example.com', name: 'Alice' }],
    to: [{ email: 'bob@example.com', name: 'Bob' }],
    hasAttachment: false,
    folderId: ['d'],
  },
  ...overrides,
});

const makeMockDb = () => ({
  put: vi.fn().mockResolvedValue('key'),
  putMany: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue([]),
  getByIndex: vi.fn().mockResolvedValue([]),
  getByRange: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(0),
  getBatch: vi.fn().mockResolvedValue({ items: [], nextCursor: undefined }),
  getBatchByFolder: vi.fn().mockResolvedValue({ items: [], nextCursor: undefined }),
  deleteOldest: vi.fn().mockResolvedValue(undefined),
});

describe('EmailRepository', () => {
  let db: ReturnType<typeof makeMockDb>;
  let crypto: CryptoEmail;
  let repo: EmailRepository;

  beforeEach(() => {
    db = makeMockDb();
    crypto = new CryptoEmail(FIXED_KEY);
    repo = new EmailRepository(db as unknown as DatabaseService, crypto);
  });

  describe('Add', () => {
    test('When adding an email, then it is stored encrypted in the correct store', async () => {
      const email = makeEmail();
      vi.spyOn(crypto, 'encrypt').mockResolvedValue({ subject: 'enc:Hello', body: 'enc:World' });

      await repo.add(email);

      expect(db.put).toHaveBeenCalledWith(
        STORE,
        expect.objectContaining({
          id: email.id,
          mail: { subject: 'enc:Hello', body: 'enc:World' },
        }),
      );
    });

    test('When adding multiple emails, then all are stored encrypted', async () => {
      const emails = [makeEmail({ id: '1' }), makeEmail({ id: '2' })];
      vi.spyOn(crypto, 'encrypt').mockResolvedValue({ subject: 'enc', body: 'enc' });

      await repo.addMany(emails);

      expect(db.putMany).toHaveBeenCalledWith(STORE, expect.any(Array));
      const stored = db.putMany.mock.calls[0][1] as StoredEmail[];
      expect(stored).toHaveLength(2);
    });

    test('When adding more than 50 emails, then they are stored in chunks', async () => {
      const emails = Array.from({ length: 120 }, (_, i) => makeEmail({ id: `email-${i}` }));
      vi.spyOn(crypto, 'encrypt').mockResolvedValue({ subject: 'enc', body: 'enc' });

      await repo.addMany(emails);

      expect(db.putMany).toHaveBeenCalledTimes(3);
      const [firstChunk, secondChunk, thirdChunk] = db.putMany.mock.calls.map((c) => c[1] as StoredEmail[]);
      expect(firstChunk).toHaveLength(50);
      expect(secondChunk).toHaveLength(50);
      expect(thirdChunk).toHaveLength(20);
    });
  });

  describe('Get by ID', () => {
    test('When getting an existing email, then it is returned decrypted', async () => {
      const email = makeEmail();
      db.get.mockResolvedValue({ ...email, mail: { subject: 'enc:Hello', body: 'enc:World' } });
      vi.spyOn(crypto, 'decrypt').mockResolvedValue(email.mail);

      const result = await repo.getById(email.id);

      expect(db.get).toHaveBeenCalledWith(STORE, email.id);
      expect(result.mail.subject).toBe('Hello');
    });

    test('When getting a non-existent email, then an error indicating so is thrown', async () => {
      db.get.mockResolvedValue(undefined);

      await expect(repo.getById('missing')).rejects.toThrow(EmailNotFoundError);
    });
  });

  describe('Get by folder', () => {
    test('When getting emails by folder, then they are queried via getBatchByFolder and returned decrypted', async () => {
      const email = makeEmail();
      db.getBatchByFolder.mockResolvedValue({
        items: [{ ...email, mail: { subject: 'enc', body: 'enc' } }],
        nextCursor: undefined,
      });
      vi.spyOn(crypto, 'decrypt').mockResolvedValue(email.mail);

      const { emails } = await repo.getByFolder('inbox', 10);

      expect(db.getBatchByFolder).toHaveBeenCalledWith(
        STORE,
        EMAIL_DB_INDEXES_KEYS.byFolderIdAndTime,
        'inbox',
        10,
        undefined,
      );
      expect(emails).toHaveLength(1);
      expect(emails[0].mail.subject).toBe('Hello');
    });

    test('When folder is empty, then it returns an empty array', async () => {
      db.getBatchByFolder.mockResolvedValue({ items: [], nextCursor: undefined });

      const { emails } = await repo.getByFolder('inbox', 10);

      expect(emails).toEqual([]);
    });

    test('When there are more emails than batchSize, then nextCursor is returned', async () => {
      const email = makeEmail();
      db.getBatchByFolder.mockResolvedValue({
        items: [email],
        nextCursor: '2024-01-15T00:00:00.000Z',
      });
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      const { emails, nextCursor } = await repo.getByFolder('inbox', 1);

      expect(emails).toHaveLength(1);
      expect(nextCursor).toBe('2024-01-15T00:00:00.000Z');
    });

    test('When called with a cursor, then it forwards it to the db', async () => {
      db.getBatchByFolder.mockResolvedValue({ items: [], nextCursor: undefined });

      await repo.getByFolder('inbox', 10, 'some-cursor');

      expect(db.getBatchByFolder).toHaveBeenCalledWith(
        STORE,
        EMAIL_DB_INDEXES_KEYS.byFolderIdAndTime,
        'inbox',
        10,
        'some-cursor',
      );
    });
  });

  describe('Get latest in folder', () => {
    test('When folder has emails, then the first result from getBatchByFolder is returned', async () => {
      const email = makeEmail({ id: 'latest' });
      db.getBatchByFolder.mockResolvedValue({ items: [email], nextCursor: undefined });
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      const result = await repo.getLatestInFolder('inbox');

      expect(db.getBatchByFolder).toHaveBeenCalledWith(
        STORE,
        EMAIL_DB_INDEXES_KEYS.byFolderIdAndTime,
        'inbox',
        1,
        undefined,
      );
      expect(result?.id).toBe('latest');
    });

    test('When folder is empty, then it returns undefined', async () => {
      db.getBatchByFolder.mockResolvedValue({ items: [], nextCursor: undefined });

      const result = await repo.getLatestInFolder('inbox');

      expect(result).toBeUndefined();
    });
  });

  describe('Remove', () => {
    test('When removing an email, then it is deleted from the correct store', async () => {
      await repo.remove('email-1');

      expect(db.remove).toHaveBeenCalledWith(STORE, 'email-1');
    });
  });

  describe('Count', () => {
    test('When counting, then it queries the correct store', async () => {
      db.count.mockResolvedValue(5);

      const result = await repo.count();

      expect(db.count).toHaveBeenCalledWith(STORE);
      expect(result).toBe(5);
    });
  });

  describe('Enforce max', () => {
    test('When count is below max, then nothing is deleted', async () => {
      db.count.mockResolvedValue(3);

      await repo.enforceMax(5);

      expect(db.deleteOldest).not.toHaveBeenCalled();
    });

    test('When count exceeds max, then oldest are deleted from the correct store', async () => {
      db.count.mockResolvedValue(8);

      await repo.enforceMax(5);

      expect(db.deleteOldest).toHaveBeenCalledWith(STORE, EMAIL_DB_INDEXES_KEYS.byTime, 3);
    });
  });

  describe('Get batch', () => {
    test('When getting a batch, then emails are returned decrypted', async () => {
      const email = makeEmail();
      db.getBatch.mockResolvedValue({
        items: [{ ...email, mail: { subject: 'enc', body: 'enc' } }],
        nextCursor: 'cursor-1',
      });
      vi.spyOn(crypto, 'decrypt').mockResolvedValue(email.mail);

      const { emails, nextCursor } = await repo.getBatch(10);

      expect(db.getBatch).toHaveBeenCalledWith(STORE, EMAIL_DB_INDEXES_KEYS.byTime, 10, undefined);
      expect(emails).toHaveLength(1);
      expect(emails[0].mail.subject).toBe('Hello');
      expect(nextCursor).toBe('cursor-1');
    });
  });

  describe('Search', () => {
    test('When filtering by read status, then it uses the byRead index', async () => {
      const read = makeEmail({ id: '1', params: { ...makeEmail().params, isRead: true } });
      db.getByIndex.mockResolvedValue([read]);
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      const result = await repo.search({ isRead: true });

      expect(db.getByIndex).toHaveBeenCalledWith(STORE, EMAIL_DB_INDEXES_KEYS.byRead, 1);
      expect(result).toHaveLength(1);
      expect(result[0].params.isRead).toBe(true);
    });

    test('When filtering by isRead false, then it queries with value 0', async () => {
      db.getByIndex.mockResolvedValue([]);
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      await repo.search({ isRead: false });

      expect(db.getByIndex).toHaveBeenCalledWith(STORE, EMAIL_DB_INDEXES_KEYS.byRead, 0);
    });

    test('When filtering by from, then it uses the byFrom index', async () => {
      const email = makeEmail();
      db.getByIndex.mockResolvedValue([email]);
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      await repo.search({ from: 'alice' });

      expect(db.getByIndex).toHaveBeenCalledWith(STORE, EMAIL_DB_INDEXES_KEYS.byFrom, 'alice');
    });

    test('When filtering by from with no match, then empty array is returned', async () => {
      const email = makeEmail({ params: { ...makeEmail().params, from: [{ email: 'other@example.com' }] } });
      db.getByIndex.mockResolvedValue([email]);
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      const result = await repo.search({ from: 'alice' });

      expect(result).toHaveLength(0);
    });

    test('When filtering by date range, then only emails in range are returned', async () => {
      const inRange = makeEmail({
        id: '1',
        params: { ...makeEmail().params, receivedAt: new Date('2024-01-15').toISOString() },
      });
      const outOfRange = makeEmail({
        id: '2',
        params: { ...makeEmail().params, receivedAt: new Date('2024-03-01').toISOString() },
      });
      db.getByRange.mockResolvedValue([inRange, outOfRange]);
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      const result = await repo.search({
        dateRange: {
          after: new Date('2024-01-01').getTime(),
          before: new Date('2024-02-01').getTime(),
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    test('When filtering by attachment type, then only matching emails are returned', async () => {
      const email = makeEmail({
        params: { ...makeEmail().params, hasAttachment: true, attachmentTypes: ['pdf'] },
      });
      db.getByIndex.mockResolvedValue([email]);
      vi.spyOn(crypto, 'decrypt').mockImplementation(async (mail) => mail);

      const result = await repo.search({ attachmentType: 'pdf' });

      expect(result).toHaveLength(1);
    });
  });
});
