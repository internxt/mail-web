import type { ComposePayload } from '@/types/mail';
import { useMemo } from 'react';
import { formatEmailToForward, formatEmailToReply } from '../helpers/format-email';
import type { Recipient } from '../types';
import { useTranslationContext } from '@/i18n';

type InitialComposeData = {
  replyToEmailId?: string;
  subject: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  htmlBody?: string;
};

type InitialComposeState = {
  mode: ComposePayload['mode'];
  data: InitialComposeData;
};

const withIds = (users: { email: string; name?: string }[] | undefined): Recipient[] =>
  (users ?? []).map((u) => ({ id: crypto.randomUUID(), email: u.email, name: u.name }));

const EMPTY_DATA: InitialComposeData = { subject: '', to: [], cc: [], bcc: [] };

export const useInitialComposeState = (compose: ComposePayload | undefined): InitialComposeState => {
  const { translate } = useTranslationContext();

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
      case 'replyAll':
      case 'forward': {
        const forward = formatEmailToForward(compose.sourceMail, translate);

        return {
          mode: compose.mode,
          data: {
            subject: forward.subject ?? '',
            to: withIds(forward.to),
            cc: withIds(forward.cc),
            bcc: withIds(forward.bcc),
            htmlBody: forward.htmlBody ?? undefined,
          },
        };
      }
      case 'draft':
      case 'new':
        return { mode: compose.mode, data: EMPTY_DATA };
    }
  }, [compose, translate]);
};
