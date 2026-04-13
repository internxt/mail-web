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
  byFolder: 'byFolderId',
};

export type Database = {
  put: (record: StoredEmail) => Promise<IDBValidKey>;
  putMany: (records: StoredEmail[]) => Promise<void>;
  get: (id: string) => Promise<StoredEmail | undefined>;
  getAll: () => Promise<StoredEmail[]>;
  getByIndex: (indexName: string, value: IDBValidKey) => Promise<StoredEmail[]>;
  getByRange: (indexName: string, range: IDBKeyRange) => Promise<StoredEmail[]>;
  getByFolder: (folderId: string, limit?: number) => Promise<StoredEmail[]>;
  remove: (id: string) => Promise<void>;
  count: () => Promise<number>;
  getBatch: (
    batchSize: number,
    startCursor?: IDBValidKey,
  ) => Promise<{ items: StoredEmail[]; nextCursor?: IDBValidKey }>;
  deleteOldest: (count: number) => Promise<void>;
};
