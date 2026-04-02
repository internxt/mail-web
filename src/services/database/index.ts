import { openDB, deleteDB, type IDBPDatabase } from 'idb';
import type { StoredEmail, DatabaseConfig } from './types';

export class DatabaseService {
  private db: IDBPDatabase | null = null;
  private readonly userId: string;
  private readonly config: DatabaseConfig;

  constructor(userId: string, config: DatabaseConfig) {
    this.userId = userId;
    this.config = config;
  }

  private getDbName(): string {
    return `DB:${this.userId}`;
  }

  private getDb(): IDBPDatabase {
    if (!this.db) throw new Error('Database not opened');
    return this.db;
  }

  async open(): Promise<void> {
    const { store, version, indexes } = this.config;

    this.db = await openDB(this.getDbName(), version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(store)) {
          const objectStore = db.createObjectStore(store, { keyPath: 'id' });

          for (const index of indexes) {
            objectStore.createIndex(index.name, index.keyPath, index.options);
          }
        }
      },
    });
  }

  close(): void {
    this.getDb().close();
    this.db = null;
  }

  async destroy(): Promise<void> {
    this.close();
    await deleteDB(this.getDbName());
  }

  async put(record: StoredEmail): Promise<IDBValidKey> {
    return this.getDb().put(this.config.store, record);
  }

  async putMany(records: StoredEmail[]): Promise<void> {
    const tx = this.getDb().transaction(this.config.store, 'readwrite');
    await Promise.all([...records.map((r) => tx.store.put(r)), tx.done]);
  }

  async get(id: string): Promise<StoredEmail | undefined> {
    return this.getDb().get(this.config.store, id);
  }

  async getAll(): Promise<StoredEmail[]> {
    return this.getDb().getAll(this.config.store);
  }

  async getByIndex(indexName: string, value: IDBValidKey): Promise<StoredEmail[]> {
    const tx = this.getDb().transaction(this.config.store, 'readonly');
    return tx.store.index(indexName).getAll(value) as Promise<StoredEmail[]>;
  }

  async getByRange(indexName: string, range: IDBKeyRange): Promise<StoredEmail[]> {
    const tx = this.getDb().transaction(this.config.store, 'readonly');
    return tx.store.index(indexName).getAll(range) as Promise<StoredEmail[]>;
  }

  async getByFolder(folderId: string, limit?: number): Promise<StoredEmail[]> {
    const tx = this.getDb().transaction(this.config.store, 'readonly');
    const results = await tx.store.index('byFolder').getAll(folderId);

    results.sort((a, b) => {
      const dateA = Number((a as StoredEmail).params.receivedAt);
      const dateB = Number((b as StoredEmail).params.receivedAt);
      return dateB - dateA;
    });

    return limit ? (results.slice(0, limit) as StoredEmail[]) : (results as StoredEmail[]);
  }

  async remove(id: string): Promise<void> {
    await this.getDb().delete(this.config.store, id);
  }

  async count(): Promise<number> {
    return this.getDb().count(this.config.store);
  }

  async getBatch(
    batchSize: number,
    startCursor?: IDBValidKey,
  ): Promise<{ items: StoredEmail[]; nextCursor?: IDBValidKey }> {
    const tx = this.getDb().transaction(this.config.store, 'readonly');
    const index = tx.store.index('byTime');

    const items: StoredEmail[] = [];
    let cursor = startCursor
      ? await index.openCursor(IDBKeyRange.upperBound(startCursor, true), 'prev')
      : await index.openCursor(null, 'prev');

    let nextCursor: IDBValidKey | undefined;

    while (cursor && items.length < batchSize) {
      items.push(cursor.value as StoredEmail);
      nextCursor = cursor.key;
      cursor = await cursor.continue();
    }

    return {
      items,
      nextCursor: items.length === batchSize ? nextCursor : undefined,
    };
  }

  async deleteOldest(count: number): Promise<void> {
    const tx = this.getDb().transaction(this.config.store, 'readwrite');
    const index = tx.store.index('byTime');
    let cursor = await index.openCursor();
    let deleted = 0;

    while (cursor && deleted < count) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }

    await tx.done;
  }
}
