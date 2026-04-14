import { openDB, type IDBPDatabase } from 'idb';
import type { Database, DatabaseConfig } from './types';

export class DatabaseService implements Database {
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
      upgrade(db, _oldVersion, _newVersion, tx) {
        for (const store of stores) {
          const objectStore = db.objectStoreNames.contains(store.name)
            ? tx.objectStore(store.name)
            : db.createObjectStore(store.name, { keyPath: store.keyPath });

          for (const index of store.indexes) {
            if (!objectStore.indexNames.contains(index.name)) {
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

  /**
   * Gets a batch of items from the given store and index.
   * The batch is limited by the given batchSize.
   * If a startCursor is given, then the batch will start from the item with the given key.
   * If the batch size is reached, then the nextCursor will be the key of the item after the last item in the batch.
   * If the batch size is not reached, then the nextCursor will be undefined.
   * @param store The name of the store.
   * @param indexName The name of the index.
   * @param batchSize The maximum number of items in the batch.
   * @param startCursor The key of the item to start the batch from.
   * @returns A promise that resolves with an object containing the items in the batch and the nextCursor.
   */
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
