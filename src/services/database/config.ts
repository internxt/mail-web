import type { DatabaseConfig } from './types';

export const INDEXED_DB_VERSION = 1;
export const STORED_EMAILS_DB_LABEL = 'emails';

export const EMAIL_DB_CONFIG: DatabaseConfig = {
  store: STORED_EMAILS_DB_LABEL,
  version: INDEXED_DB_VERSION,
  indexes: [
    { name: 'byTime', keyPath: 'params.receivedAt' },
    { name: 'byRead', keyPath: 'params.isRead' },
    { name: 'byFrom', keyPath: 'params.from' },
    { name: 'byTo', keyPath: 'params.to' },
    { name: 'byAttachmentType', keyPath: 'params.attachmentTypes', options: { multiEntry: true } },
    { name: 'byFolder', keyPath: 'params.folderId' },
  ],
};
