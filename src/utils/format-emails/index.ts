import { DateService } from '@/services/date';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';

type EmailSummary = EmailListResponse['emails'][number];

const toParticipant = (sender: EmailSummary['from'][number]) => ({
  name: sender.name ?? sender.email.split('@')[0],
  avatar: '',
});

export const formatEmailsToList = (
  listFolderEmails?: EmailListResponse['emails'],
  decryptedPreviews?: Record<string, string>,
) => {
  return listFolderEmails?.map((mail) => ({
    id: mail.id,
    from: (mail.participants ?? mail.from).map(toParticipant),
    subject: mail.subject,
    createdAt: DateService.formatMailTimestamp(mail.lastReceivedAt ?? mail.receivedAt),
    body: decryptedPreviews?.[mail.id] ?? (mail.encryption ? '' : mail.preview),
    read: mail.isRead,
  }));
};
