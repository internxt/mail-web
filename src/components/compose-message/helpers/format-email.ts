import type { EmailAddress, EmailResponse } from '@internxt/sdk/dist/mail/types';
import type { Translate } from '@/i18n';
import dayjs from 'dayjs';

export type ReplyDraft = Partial<EmailResponse> & {
  replyToEmailId: string;
};

export type ForwardDraft = Partial<EmailResponse>;

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

const formatAddress = (address: EmailAddress): string => {
  const name = address.name?.trim();
  return name ? `${name} &lt;${address.email}&gt;` : `&lt;${address.email}&gt;`;
};

const formatAddressList = (addresses: EmailAddress[] | undefined): string =>
  (addresses ?? []).map(formatAddress).join(', ');

export const formatEmailToForward = (mail: EmailResponse, translate: Translate): ForwardDraft => {
  const date = dayjs(mail.sentAt ?? mail.receivedAt).format('LLL');
  const originalBody = mail.htmlBody ?? mail.textBody ?? '';

  const lines = [
    translate('mail.forward.header'),
    `${translate('mail.forward.from')}: ${formatAddress(mail.from[0])}`,
    `${translate('mail.forward.date')}: ${date}`,
    `${translate('mail.forward.subject')}: ${mail.subject}`,
    `${translate('mail.forward.to')}: ${formatAddressList(mail.to)}`,
  ];

  if (mail.cc && mail.cc.length > 0) {
    lines.push(`${translate('mail.forward.cc')}: ${formatAddressList(mail.cc)}`);
  }
  if (mail.bcc && mail.bcc.length > 0) {
    lines.push(`${translate('mail.forward.bcc')}: ${formatAddressList(mail.bcc)}`);
  }

  const body = `${lines.join('<br>')}<br><br>${originalBody}`;

  return {
    subject: mail.subject.startsWith('Fwd:') ? mail.subject : `Fwd: ${mail.subject}`,
    to: [],
    cc: [],
    bcc: [],
    htmlBody: body,
    textBody: body,
  };
};
