import { EMAIL_DB_INDEXES_KEYS, type DatabaseConfig } from '../types';
import { generateEmailParamPath } from './utils';

const mailStore = {
  name: 'emails',
  keyPath: 'id',
  indexes: [
    { name: EMAIL_DB_INDEXES_KEYS.byTime, keyPath: generateEmailParamPath('receivedAt') },
    { name: EMAIL_DB_INDEXES_KEYS.byRead, keyPath: generateEmailParamPath('isRead') },
    { name: EMAIL_DB_INDEXES_KEYS.byFrom, keyPath: generateEmailParamPath('from'), options: { multiEntry: true } },
    { name: EMAIL_DB_INDEXES_KEYS.byTo, keyPath: generateEmailParamPath('to'), options: { multiEntry: true } },
    {
      name: EMAIL_DB_INDEXES_KEYS.byAttachmentType,
      keyPath: generateEmailParamPath('attachmentTypes'),
      options: { multiEntry: true },
    },
  ],
};

export const MAIL_DB_CONFIG: DatabaseConfig = {
  version: 1,
  stores: [mailStore],
};
