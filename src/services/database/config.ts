import type { DatabaseConfig } from './types';

export const EMAIL_DB_CONFIG: DatabaseConfig = {
  store: 'emails',
  version: 1,
  indexes: [
    { name: 'byTime', keyPath: 'params.receivedAt' },
    { name: 'byRead', keyPath: 'params.isRead' },
    { name: 'byFrom', keyPath: 'params.from' },
    { name: 'byTo', keyPath: 'params.to' },
    { name: 'byAttachmentType', keyPath: 'params.attachmentTypes', options: { multiEntry: true } },
    { name: 'byFolder', keyPath: 'params.folder' },
  ],
};
