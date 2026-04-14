export type AttachmentType =
  | 'folder'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'document'
  | 'powerpoint'
  | 'excel';

export interface User {
  email?: string;
  name?: string;
  avatar?: string;
}

export interface EmailParams {
  folderId: string;
  isReadFlag: 0 | 1;
  receivedAt: string;
  fromEmails: string[];
  toEmails: string[];
  hasAttachment: boolean;
  attachmentTypes?: AttachmentType[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

export interface StoreConfig {
  name: string;
  keyPath: string;
  indexes: IndexConfig[];
}

export const EMAIL_DB_INDEXES_KEYS = {
  byTime: 'byTime',
  byRead: 'byRead',
  byFrom: 'byFrom',
  byTo: 'byTo',
  byAttachmentType: 'byAttachmentType',
  byFolderIdAndTime: 'byFolderIdAndTime',
} as const;

export interface DatabaseConfig {
  version: number;
  stores: StoreConfig[];
}

export interface Database {
  open: () => Promise<void>;
  close: () => void;
  get: <T>(storeName: string, key: IDBValidKey) => Promise<T | undefined>;
  getAll: <T>(storeName: string) => Promise<T[]>;
  getByIndex: <T>(storeName: string, indexName: string, key: IDBValidKey) => Promise<T[]>;
  getByRange: <T>(storeName: string, indexName: string, range: IDBKeyRange) => Promise<T[]>;
  put: <T>(storeName: string, record: T) => Promise<IDBValidKey>;
  putMany: <T>(storeName: string, records: T[]) => Promise<void>;
  remove: (storeName: string, key: IDBValidKey) => Promise<void>;
  count: (storeName: string) => Promise<number>;
  deleteOldest: (storeName: string, indexName: string, count: number) => Promise<void>;
  getBatch: <T>(
    storeName: string,
    indexName: string,
    batchSize: number,
    startCursor?: IDBValidKey,
  ) => Promise<{ items: T[]; nextCursor?: IDBValidKey }>;
}
