import { useCallback, useState } from 'react';
import PreviewMail from '../mail-preview';
import type { DecryptedMail } from '@/types/mail';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';

interface ThreadViewProps {
  thread: DecryptedMail[];
}

export const ThreadView = ({ thread }: ThreadViewProps) => {
  const [toggledMailIds, setToggledMailIds] = useState<Set<string>>(() => new Set());

  const mostRecentMailId = thread[0]?.id;

  const isMailCollapsed = (mailId: string) => {
    if (mailId === mostRecentMailId) return false;
    return !toggledMailIds.has(mailId);
  };

  const onToggleCollapsed = useCallback(
    (mailId: string) => {
      if (mailId === mostRecentMailId) return;
      setToggledMailIds((prev) => {
        const next = new Set(prev);
        if (next.has(mailId)) next.delete(mailId);
        else next.add(mailId);
        return next;
      });
    },
    [mostRecentMailId],
  );

  return (
    <div className="flex flex-col w-full overflow-y-auto">
      {thread.map((mail) => (
        <div className="flex flex-col w-full" key={mail.id}>
          <PreviewMail
            from={{
              name: mail.from[0]?.name ?? mail.from[0]?.email ?? '',
              email: mail.from[0]?.email ?? '',
            }}
            to={mail.to.map((u) => ({ name: u.name ?? '', email: u.email }))}
            cc={mail.cc.map((u) => ({ name: u.name ?? '', email: u.email }))}
            bcc={mail.bcc.map((u) => ({ name: u.name ?? '', email: u.email }))}
            mail={{
              id: mail.id,
              subject: mail.subject,
              receivedAt: mail.receivedAt,
              htmlBody: mail.decryptError ? '' : (mail.htmlBody ?? ''),
              attachments: mail.attachments,
              isEncrypted: mail.isEncrypted,
              decryptError: !!mail.decryptError,
              envelope: (mail.encryption ?? null) as EncryptionBlock | null,
            }}
            collapsed={isMailCollapsed(mail.id)}
            onToggleCollapsed={mail.id === mostRecentMailId ? undefined : () => onToggleCollapsed(mail.id)}
          />
          <div className="border-b border-gray-5 mr-5" />
        </div>
      ))}
    </div>
  );
};
