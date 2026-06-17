import type { ComposePayload, DecryptedMail } from '@/types/mail';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { useMemo } from 'react';
import { formatEmailToReply } from '../helpers/format-email';
import type { Recipient } from '../types';
import type { InheritedAttachmentInput } from './useAttachments';

type InitialComposeData = {
  replyToEmailId?: string;
  subject: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  htmlBody?: string;
  inheritedAttachments?: InheritedAttachmentInput[];
};

type InitialComposeState = {
  mode: ComposePayload['mode'];
  data: InitialComposeData;
};

const withIds = (users: { email: string; name?: string }[] | undefined): Recipient[] =>
  (users ?? []).map((u) => ({ id: crypto.randomUUID(), email: u.email, name: u.name }));

const EMPTY_DATA: InitialComposeData = { subject: '', to: [], cc: [], bcc: [] };

const extractInheritedAttachments = (mail: DecryptedMail): InheritedAttachmentInput[] => {
  if (!mail.encryption || !mail.attachments || mail.attachments.length === 0) return [];
  const envelope = mail.encryption as EncryptionBlock;
  return mail.attachments.map((a) => ({
    originalMailId: mail.id,
    originalBlobId: a.blobId,
    originalEnvelope: envelope,
    name: a.name,
    size: a.size,
    type: a.type,
  }));
};

export const useInitialComposeState = (compose: ComposePayload | undefined): InitialComposeState => {
  return useMemo(() => {
    if (!compose) return { mode: 'new', data: EMPTY_DATA };
    switch (compose.mode) {
      case 'reply': {
        const reply = formatEmailToReply(compose.sourceMail);
        return {
          mode: compose.mode,
          data: {
            replyToEmailId: reply.replyToEmailId,
            subject: reply.subject ?? '',
            to: withIds(reply.to),
            cc: withIds(reply.cc),
            bcc: withIds(reply.bcc),
            htmlBody: reply.htmlBody ?? undefined,
          },
        };
      }
      case 'forward':
        return {
          mode: compose.mode,
          data: {
            ...EMPTY_DATA,
            inheritedAttachments: extractInheritedAttachments(compose.sourceMail),
          },
        };
      case 'replyAll':
      case 'draft':
      case 'new':
        return { mode: compose.mode, data: EMPTY_DATA };
    }
  }, [compose]);
};
