import { DateService } from '@/services/date';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';

export const formatEmailsToList = (listFolderEmails?: EmailListResponse['emails']) => {
  return listFolderEmails?.map((mail) => ({
    id: mail.id,
    from: {
      name: mail.from[0]?.name ?? mail.from[0]?.email ?? '',
      avatar: '',
    },
    subject: mail.subject,
    createdAt: DateService.formatMailTimestamp(mail.receivedAt),
    body: mail.preview,
    read: mail.isRead,
  }));
};
