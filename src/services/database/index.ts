import { openDB, deleteDB, type IDBPDatabase } from 'idb';
import type { DatabaseConfig } from './types';

export class DatabaseService {
  private db: IDBPDatabase | null = null;
  private readonly dbName: string;
  private readonly config: DatabaseConfig;

  constructor(dbName: string, config: DatabaseConfig) {
    this.dbName = dbName;
    this.config = config;
  }

  private getDb(): IDBPDatabase {
    if (!this.db) throw new Error('Database not opened');
    return this.db;
  }

  async open(): Promise<void> {
    const { version, stores } = this.config;

    this.db = await openDB(this.dbName, version, {
      upgrade(db) {
        for (const store of stores) {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });

            for (const index of store.indexes) {
              objectStore.createIndex(index.name, index.keyPath, index.options);
            }
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
    await deleteDB(this.dbName);
  }

  async get<T>(store: string, id: IDBValidKey): Promise<T | undefined> {
    return this.getDb().get(store, id) as Promise<T | undefined>;
  }

  async getAll<T>(store: string): Promise<T[]> {
    return this.getDb().getAll(store) as Promise<T[]>;
  }

  async put<T>(store: string, record: T): Promise<IDBValidKey> {
    return this.getDb().put(store, record);
  }

  async putMany<T>(store: string, records: T[]): Promise<void> {
    const tx = this.getDb().transaction(store, 'readwrite');
    await Promise.all([...records.map((r) => tx.store.put(r)), tx.done]);
  }

  async remove(store: string, id: IDBValidKey): Promise<void> {
    await this.getDb().delete(store, id);
  }

  async count(store: string): Promise<number> {
    return this.getDb().count(store);
  }

  async getByIndex<T>(store: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    const tx = this.getDb().transaction(store, 'readonly');
    return tx.store.index(indexName).getAll(value) as Promise<T[]>;
  }

  async getByRange<T>(store: string, indexName: string, range: IDBKeyRange): Promise<T[]> {
    const tx = this.getDb().transaction(store, 'readonly');
    return tx.store.index(indexName).getAll(range) as Promise<T[]>;
  }

  async getBatch<T>(
    store: string,
    indexName: string,
    batchSize: number,
    startCursor?: IDBValidKey,
  ): Promise<{ items: T[]; nextCursor?: IDBValidKey }> {
    const tx = this.getDb().transaction(store, 'readonly');
    const index = tx.store.index(indexName);

    const items: T[] = [];
    let cursor = startCursor
      ? await index.openCursor(IDBKeyRange.upperBound(startCursor, true), 'prev')
      : await index.openCursor(null, 'prev');

    let nextCursor: IDBValidKey | undefined;

    while (cursor && items.length < batchSize) {
      items.push(cursor.value as T);
      nextCursor = cursor.key;
      cursor = await cursor.continue();
    }

    return {
      items,
      nextCursor: items.length === batchSize ? nextCursor : undefined,
    };
  }

  async deleteOldest(store: string, indexName: string, count: number): Promise<void> {
    const tx = this.getDb().transaction(store, 'readwrite');
    const index = tx.store.index(indexName);
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
