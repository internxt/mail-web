import type { EmailResponse } from '@internxt/sdk/dist/mail/types';

export type ReplyDraft = Partial<EmailResponse> & {
  replyToEmailId: string;
};

export const formatEmailToReply = (mail: EmailResponse): ReplyDraft => {
  return {
    replyToEmailId: mail.id,
    to: mail.from,
    cc: mail.cc ?? [],
    bcc: mail.bcc ?? [],
    subject: mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
    htmlBody: mail.htmlBody,
    textBody: mail.textBody,
    threadId: mail.threadId,
  };
};
