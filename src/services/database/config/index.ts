import { EMAIL_DB_INDEXES_KEYS, type DatabaseConfig } from '../types';
import { generateEmailParamPath } from './utils';

const mailStore = {
  name: 'emails',
  keyPath: 'id',
  indexes: [
    { name: EMAIL_DB_INDEXES_KEYS.byTime, keyPath: generateEmailParamPath('receivedAt') },
    { name: EMAIL_DB_INDEXES_KEYS.byRead, keyPath: generateEmailParamPath('isReadFlag') },
    {
      name: EMAIL_DB_INDEXES_KEYS.byFrom,
      keyPath: generateEmailParamPath('fromEmails'),
      options: { multiEntry: true },
    },
    { name: EMAIL_DB_INDEXES_KEYS.byTo, keyPath: generateEmailParamPath('toEmails'), options: { multiEntry: true } },
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
