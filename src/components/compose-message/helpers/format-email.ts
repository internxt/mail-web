import type { EmailAddress, EmailResponse } from '@internxt/sdk/dist/mail/types';
import type { Translate } from '@/i18n';
import dayjs from 'dayjs';

export type ReplyDraft = Partial<EmailResponse> & {
  replyToEmailId: string;
};

export type ForwardDraft = Partial<EmailResponse>;

export const formatEmailToReply = (mail: EmailResponse): ReplyDraft => {
  const hasReplyPrefix = /^\s*re:/i.test(mail.subject);
  return {
    replyToEmailId: mail.id,
    to: mail.from,
    cc: mail.cc ?? [],
    bcc: mail.bcc ?? [],
    subject: hasReplyPrefix ? mail.subject : `Re: ${mail.subject}`,
    htmlBody: mail.htmlBody,
    textBody: mail.textBody,
    threadId: mail.threadId,
  };
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatAddress = (address: EmailAddress): string => {
  const name = address.name?.trim();
  return name ? `${escapeHtml(name)} &lt;${escapeHtml(address.email)}&gt;` : `&lt;${escapeHtml(address.email)}&gt;`;
};

const formatAddressList = (addresses: EmailAddress[] | undefined): string =>
  (addresses ?? []).map(formatAddress).join(', ');

export const formatEmailToForward = (mail: EmailResponse, translate: Translate): ForwardDraft => {
  const date = dayjs(mail.sentAt ?? mail.receivedAt).format('LLL');
  const originalBody = mail.htmlBody ?? mail.textBody ?? '';

  const lines = [
    translate('mail.forward.header'),
    ...(mail.from?.length ? [`${translate('mail.forward.from')}: ${formatAddress(mail.from[0])}`] : []),
    `${translate('mail.forward.date')}: ${date}`,
    `${translate('mail.forward.subject')}: ${escapeHtml(mail.subject)}`,
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
    subject: (() => {
      const prefix = translate('mail.forward.prefix');
      return mail.subject?.toLowerCase().startsWith(prefix.toLowerCase()) ? mail.subject : `${prefix} ${mail.subject}`;
    })(),
    to: [],
    cc: [],
    bcc: [],
    htmlBody: body,
    textBody: body,
  };
};
