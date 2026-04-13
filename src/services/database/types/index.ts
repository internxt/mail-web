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

export interface Email {
  subject: string;
  body: string;
}

export interface User {
  email?: string;
  name?: string;
  avatar?: string;
}

export interface EmailParams {
  folderId?: string[];
  isRead: boolean;
  receivedAt: string;
  from: User[];
  to: User[];
  hasAttachment: boolean;
  attachmentTypes?: AttachmentType[];
}

export interface StoredEmail {
  id: string;
  mail: Email;
  params: EmailParams;
}

export interface EmailFilters {
  from?: string;
  to?: string;
  isRead?: boolean;
  dateRange?: {
    after: number;
    before: number;
  };
  attachmentType?: AttachmentType;
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

export interface DatabaseConfig {
  version: number;
  stores: StoreConfig[];
}

export const EMAIL_DB_INDEXES_KEYS = {
  byTime: 'byTime',
  byRead: 'byRead',
  byFrom: 'byFrom',
  byTo: 'byTo',
  byAttachmentType: 'byAttachmentType',
  byFolderId: 'byFolderId',
  byFolderIdAndTime: 'byFolderIdAndTime',
};

export type Database = {
  open: () => Promise<void>;
  close: () => void;
  getAll: <T>(storeName: string) => Promise<T[]>;
  getByIndex: <T>(storeName: string, indexName: string, key: string | string[]) => Promise<T[]>;
  getByRange: <T>(storeName: string, indexName: string, range: IDBKeyRange) => Promise<T[]>;
  put: <T>(storeName: string, record: T) => Promise<IDBValidKey>;
  putMany: <T>(storeName: string, records: T[]) => Promise<void>;
  remove: (storeName: string, key: string | string[]) => Promise<void>;
  count: (storeName: string) => Promise<number>;
  deleteOldest: (storeName: string, indexName: string, count: number) => Promise<void>;
  getBatch: <T>(
    storeName: string,
    indexName: string,
    batchSize: number,
    startCursor?: string | string[],
  ) => Promise<{ items: T[]; nextCursor?: IDBValidKey }>;
  getBatchByFolder: <T>(
    storeName: string,
    indexName: string,
    folderId: string,
    batchSize: number,
    startCursor?: IDBValidKey,
  ) => Promise<{ items: T[]; nextCursor?: IDBValidKey }>;
};
