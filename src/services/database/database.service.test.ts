import 'fake-indexeddb/auto';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './index';
import type { StoredEmail, DatabaseConfig } from './types';

const TEST_USER_ID = 'user-123';

const TEST_CONFIG: DatabaseConfig = {
  store: 'emails',
  version: 1,
  indexes: [
    { name: 'byTime', keyPath: 'params.receivedAt' },
    { name: 'byRead', keyPath: 'params.isRead' },
    { name: 'byFrom', keyPath: 'params.from' },
  ],
};

const createEmail = (overrides: Partial<StoredEmail> = {}): StoredEmail => ({
  id: crypto.randomUUID(),
  mail: { subject: 'Test subject', body: 'Test body' },
  params: {
    folderId: ['d'],
    isRead: false,
    receivedAt: Date.now().toString(),
    from: [{ email: 'sender@test.com', name: 'Sender' }],
    to: [{ email: 'recipient@test.com', name: 'Recipient' }],
    hasAttachment: false,
    attachmentTypes: [],
  },
  ...overrides,
});

const createEmailWithDate = (daysAgo: number, overrides: Partial<StoredEmail> = {}): StoredEmail => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return createEmail({
    ...overrides,
    params: {
      ...createEmail().params,
      receivedAt: date.getTime().toString(),
      ...overrides.params,
    },
  });
};

describe('Database Service', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService(TEST_USER_ID, TEST_CONFIG);
    await db.open();
  });

  afterEach(async () => {
    try {
      await db.destroy();
    } catch {
      // NO OP - It is already closed
    }
  });

  describe('Lifecycle', () => {
    test('When opening the database, then it should be ready for operations', async () => {
      const email = createEmail();
      await expect(db.put(email)).resolves.toBeDefined();
    });

    test('When operating on a closed database, then it should reject with an error', async () => {
      db.close();
      await expect(db.put(createEmail())).rejects.toThrow('Database not opened');
    });

    test('When destroying the database, then all data should be removed', async () => {
      await db.put(createEmail());
      await db.destroy();

      db = new DatabaseService(TEST_USER_ID, TEST_CONFIG);
      await db.open();

      const count = await db.count();
      expect(count).toBe(0);
    });
  });

  describe('Put', () => {
    test('When putting a record, then it should be retrievable by id', async () => {
      const email = createEmail();
      await db.put(email);

      const result = await db.get(email.id);
      expect(result).toStrictEqual(email);
    });

    test('When putting a record with an existing id, then it should overwrite the previous record', async () => {
      const email = createEmail();
      await db.put(email);

      const updated = { ...email, mail: { subject: 'Updated', body: 'Updated body' } };
      await db.put(updated);

      const result = await db.get(email.id);
      expect(result?.mail.subject).toBe('Updated');
    });

    test('When putting many records, then all should be retrievable', async () => {
      const emails = [createEmail(), createEmail(), createEmail()];
      await db.putMany(emails);

      const count = await db.count();
      expect(count).toBe(3);
    });
  });

  describe('Get', () => {
    test('When getting a non-existent record, then it should return undefined', async () => {
      const result = await db.get('non-existent-id');
      expect(result).toBeUndefined();
    });

    test('When getting all records, then it should return every stored record', async () => {
      const emails = [createEmail(), createEmail()];
      await db.putMany(emails);

      const results = await db.getAll();
      expect(results).toHaveLength(2);
    });

    test('When getting all records from an empty store, then it should return an empty array', async () => {
      const results = await db.getAll();
      expect(results).toHaveLength(0);
    });
  });

  describe('Get by range', () => {
    test('When getting by date range, then it should return records within the range', async () => {
      const old = createEmailWithDate(30);
      const recent = createEmailWithDate(1);
      const veryOld = createEmailWithDate(90);
      await db.putMany([old, recent, veryOld]);

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const range = IDBKeyRange.bound(sevenDaysAgo.toString(), now.toString());
      const results = await db.getByRange('byTime', range);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(recent.id);
    });
  });

  describe('Remove', () => {
    test('When removing a record, then it should no longer be retrievable', async () => {
      const email = createEmail();
      await db.put(email);
      await db.remove(email.id);

      const result = await db.get(email.id);
      expect(result).toBeUndefined();
    });

    test('When removing a record, then the count should decrease', async () => {
      const emails = [createEmail(), createEmail()];
      await db.putMany(emails);
      await db.remove(emails[0].id);

      const count = await db.count();
      expect(count).toBe(1);
    });
  });

  describe('Count', () => {
    test('When counting an empty store, then it should return zero', async () => {
      const count = await db.count();
      expect(count).toBe(0);
    });

    test('When counting after inserts, then it should return the correct number', async () => {
      await db.putMany([createEmail(), createEmail(), createEmail()]);

      const count = await db.count();
      expect(count).toBe(3);
    });
  });

  describe('Get batch', () => {
    test('When getting a batch, then it should return the requested number of items', async () => {
      const emails = Array.from({ length: 10 }, (_, i) => createEmailWithDate(i));
      await db.putMany(emails);

      const { items } = await db.getBatch(5);
      expect(items).toHaveLength(5);
    });

    test('When getting a batch, then items should be ordered newest first', async () => {
      const emails = Array.from({ length: 5 }, (_, i) => createEmailWithDate(i));
      await db.putMany(emails);

      const { items } = await db.getBatch(5);

      for (let i = 0; i < items.length - 1; i++) {
        const current = Number(items[i].params.receivedAt);
        const next = Number(items[i + 1].params.receivedAt);
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    test('When getting a batch with a cursor, then it should continue from that position', async () => {
      const emails = Array.from({ length: 10 }, (_, i) => createEmailWithDate(i));
      await db.putMany(emails);

      const first = await db.getBatch(5);
      expect(first.items).toHaveLength(5);
      expect(first.nextCursor).toBeDefined();

      const second = await db.getBatch(5, first.nextCursor);
      expect(second.items).toHaveLength(5);

      const firstIds = new Set(first.items.map((e) => e.id));
      const hasDuplicates = second.items.some((e) => firstIds.has(e.id));
      expect(hasDuplicates).toBe(false);
    });

    test('When getting a batch larger than available records, then nextCursor should be undefined', async () => {
      await db.putMany([createEmail(), createEmail()]);

      const { items, nextCursor } = await db.getBatch(10);
      expect(items).toHaveLength(2);
      expect(nextCursor).toBeUndefined();
    });
  });

  describe('Delete oldest', () => {
    test('When deleting oldest records, then the oldest should be removed', async () => {
      const old = createEmailWithDate(30);
      const recent = createEmailWithDate(1);
      const newest = createEmailWithDate(0);
      await db.putMany([old, recent, newest]);

      await db.deleteOldest(1);

      const count = await db.count();
      expect(count).toBe(2);

      const result = await db.get(old.id);
      expect(result).toBeUndefined();
    });

    test('When deleting more than available, then all records should be removed', async () => {
      await db.putMany([createEmail(), createEmail()]);

      await db.deleteOldest(10);

      const count = await db.count();
      expect(count).toBe(0);
    });
  });
});
