import type { EmailResponse } from '@internxt/sdk/dist/mail/types';

export type FolderType = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';

export type DecryptedMail = EmailResponse & {
  isEncrypted?: boolean;
  decryptError?: string;
};

export type ComposePayload =
  | { mode: 'new' }
  | { mode: 'reply'; sourceMail: DecryptedMail }
  | { mode: 'replyAll'; sourceMail: DecryptedMail }
  | { mode: 'forward'; sourceMail: DecryptedMail }
  | { mode: 'draft'; draft: DecryptedMail };
