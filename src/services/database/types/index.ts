import type { FolderType } from '@/types/mail';

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
  folder?: FolderType;
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

export interface DatabaseConfig {
  store: string;
  version: number;
  indexes: IndexConfig[];
}
