import { DateService } from '@/services/date';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';

export const formatEmailsToList = (
  listFolderEmails?: EmailListResponse['emails'],
  decryptedPreviews?: Record<string, string>,
) => {
  return listFolderEmails?.map((mail) => ({
    id: mail.id,
    from: {
      name: mail.from[0]?.name ?? mail.from[0]?.email ?? '',
      avatar: '',
    },
    subject: mail.subject,
    createdAt: DateService.formatMailTimestamp(mail.receivedAt),
    body: decryptedPreviews?.[mail.id] ?? (mail.encryption ? '' : mail.preview),
    read: mail.isRead,
  }));
};
