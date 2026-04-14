import 'fake-indexeddb/auto';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '.';
import { MAIL_DB_CONFIG } from './config';

const STORE = 'emails';

interface TestRecord {
  id: string;
  params: { receivedAt: string; isRead: boolean };
}

const createRecord = (overrides: Partial<TestRecord> = {}): TestRecord => ({
  id: crypto.randomUUID(),
  params: {
    receivedAt: Date.now().toString(),
    isRead: false,
    ...overrides.params,
  },
  ...overrides,
});

const createRecordWithDate = (daysAgo: number, overrides: Partial<TestRecord> = {}): TestRecord => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return createRecord({
    ...overrides,
    params: {
      ...createRecord().params,
      receivedAt: date.getTime().toString(),
      ...overrides.params,
    },
  });
};

describe('Database Service', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService(`test-db-${crypto.randomUUID()}`, MAIL_DB_CONFIG);
    await db.open();
  });

  afterEach(async () => {
    try {
      db.close();
    } catch {
      // The DB is already closed
    }
  });

  describe('Lifecycle', () => {
    test('When opening the database, then it should be ready for operations', async () => {
      const record = createRecord();
      await expect(db.put(STORE, record)).resolves.toBeDefined();
    });

    test('When operating on a closed database, then it should reject with an error', async () => {
      db.close();
      await expect(db.put(STORE, createRecord())).rejects.toThrow('Database not opened');
    });
  });

  describe('Put', () => {
    test('When putting a record, then it should be retrievable by id', async () => {
      const record = createRecord();
      await db.put(STORE, record);

      const result = await db.get<TestRecord>(STORE, record.id);
      expect(result).toStrictEqual(record);
    });

    test('When putting a record with an existing id, then it should overwrite the previous record', async () => {
      const record = createRecord();
      await db.put(STORE, record);

      const updated = { ...record, params: { ...record.params, isRead: true } };
      await db.put(STORE, updated);

      const result = await db.get<TestRecord>(STORE, record.id);
      expect(result?.params.isRead).toBe(true);
    });

    test('When putting many records, then all should be retrievable', async () => {
      const records = [createRecord(), createRecord(), createRecord()];
      await db.putMany(STORE, records);

      const count = await db.count(STORE);
      expect(count).toBe(3);
    });
  });

  describe('Get', () => {
    test('When getting a non-existent record, then it should return undefined', async () => {
      const result = await db.get(STORE, 'non-existent-id');
      expect(result).toBeUndefined();
    });

    test('When getting all records, then it should return every stored record', async () => {
      await db.putMany(STORE, [createRecord(), createRecord()]);

      const results = await db.getAll(STORE);
      expect(results).toHaveLength(2);
    });

    test('When getting all records from an empty store, then it should return an empty array', async () => {
      const results = await db.getAll(STORE);
      expect(results).toHaveLength(0);
    });
  });

  describe('Get by index', () => {
    interface TestRecordWithFrom {
      id: string;
      params: { receivedAt: string; isRead: boolean; from: string[] };
    }

    const createRecordWithFrom = (from: string[]): TestRecordWithFrom => ({
      id: crypto.randomUUID(),
      params: { receivedAt: Date.now().toString(), isRead: false, from },
    });

    test('When getting by index with a matching value, then it should return matching records', async () => {
      const sender = 'sender@test.com';
      const match1 = createRecordWithFrom([sender]);
      const match2 = createRecordWithFrom([sender]);
      const other = createRecordWithFrom(['other@test.com']);
      await db.putMany(STORE, [match1, match2, other]);

      const results = await db.getByIndex<TestRecordWithFrom>(STORE, 'byFrom', sender);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(expect.arrayContaining([match1.id, match2.id]));
    });

    test('When getting by index with no matching value, then it should return an empty array', async () => {
      await db.putMany(STORE, [createRecordWithFrom(['sender@test.com'])]);

      const results = await db.getByIndex<TestRecordWithFrom>(STORE, 'byFrom', 'unknown@test.com');
      expect(results).toHaveLength(0);
    });

    test('When getting by index from an empty store, then it should return an empty array', async () => {
      const results = await db.getByIndex(STORE, 'byFrom', 'sender@test.com');
      expect(results).toHaveLength(0);
    });
  });

  describe('Get by range', () => {
    test('When getting by date range, then it should return records within the range', async () => {
      const old = createRecordWithDate(30);
      const recent = createRecordWithDate(1);
      const veryOld = createRecordWithDate(90);
      await db.putMany(STORE, [old, recent, veryOld]);

      const sevenDaysAgo = (Date.now() - 7 * 24 * 60 * 60 * 1000).toString();
      const now = Date.now().toString();

      const range = IDBKeyRange.bound(sevenDaysAgo, now);
      const results = await db.getByRange<TestRecord>(STORE, 'byTime', range);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(recent.id);
    });
  });

  describe('Remove', () => {
    test('When removing a record, then it should no longer be retrievable', async () => {
      const record = createRecord();
      await db.put(STORE, record);
      await db.remove(STORE, record.id);

      const result = await db.get(STORE, record.id);
      expect(result).toBeUndefined();
    });

    test('When removing a record, then the count should decrease', async () => {
      const records = [createRecord(), createRecord()];
      await db.putMany(STORE, records);
      await db.remove(STORE, records[0].id);

      const count = await db.count(STORE);
      expect(count).toBe(1);
    });
  });

  describe('Count', () => {
    test('When counting an empty store, then it should return zero', async () => {
      const count = await db.count(STORE);
      expect(count).toBe(0);
    });

    test('When counting after inserts, then it should return the correct number', async () => {
      await db.putMany(STORE, [createRecord(), createRecord(), createRecord()]);

      const count = await db.count(STORE);
      expect(count).toBe(3);
    });
  });

  describe('Get batch', () => {
    test('When getting a batch, then it should return the requested number of items', async () => {
      const records = Array.from({ length: 10 }, (_, i) => createRecordWithDate(i));
      await db.putMany(STORE, records);

      const { items } = await db.getBatch<TestRecord>(STORE, 'byTime', 5);
      expect(items).toHaveLength(5);
    });

    test('When getting a batch, then items should be ordered newest first', async () => {
      const records = Array.from({ length: 5 }, (_, i) => createRecordWithDate(i));
      await db.putMany(STORE, records);

      const { items } = await db.getBatch<TestRecord>(STORE, 'byTime', 5);

      for (let i = 0; i < items.length - 1; i++) {
        const current = Number(items[i].params.receivedAt);
        const next = Number(items[i + 1].params.receivedAt);
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    test('When getting a batch with a cursor, then it should continue from that position', async () => {
      const records = Array.from({ length: 10 }, (_, i) => createRecordWithDate(i));
      await db.putMany(STORE, records);

      const first = await db.getBatch<TestRecord>(STORE, 'byTime', 5);
      expect(first.items).toHaveLength(5);
      expect(first.nextCursor).toBeDefined();

      const second = await db.getBatch<TestRecord>(STORE, 'byTime', 5, first.nextCursor);
      expect(second.items).toHaveLength(5);

      const firstIds = new Set(first.items.map((e) => e.id));
      const hasDuplicates = second.items.some((e) => firstIds.has(e.id));
      expect(hasDuplicates).toBe(false);
    });

    test('When getting a batch larger than available records, then nextCursor should be undefined', async () => {
      await db.putMany(STORE, [createRecord(), createRecord()]);

      const { items, nextCursor } = await db.getBatch(STORE, 'byTime', 10);
      expect(items).toHaveLength(2);
      expect(nextCursor).toBeUndefined();
    });
  });

  describe('Delete oldest', () => {
    test('When deleting oldest records, then the oldest should be removed', async () => {
      const old = createRecordWithDate(30);
      const recent = createRecordWithDate(1);
      const newest = createRecordWithDate(0);
      await db.putMany(STORE, [old, recent, newest]);

      await db.deleteOldest(STORE, 'byTime', 1);

      const count = await db.count(STORE);
      expect(count).toBe(2);

      const result = await db.get(STORE, old.id);
      expect(result).toBeUndefined();
    });

    test('When deleting more than available, then all records should be removed', async () => {
      await db.putMany(STORE, [createRecord(), createRecord()]);

      await db.deleteOldest(STORE, 'byTime', 10);

      const count = await db.count(STORE);
      expect(count).toBe(0);
    });
  });
});
