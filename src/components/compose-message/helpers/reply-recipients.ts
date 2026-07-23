import type { EmailAddress, EmailResponse } from '@internxt/sdk/dist/mail/types';

export interface ReplyRecipients {
  to: EmailAddress[];
  cc: EmailAddress[];
}

const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

const dedupeAddresses = (addresses: EmailAddress[]): EmailAddress[] => {
  const seen = new Set<string>();
  const result: EmailAddress[] = [];
  for (const addr of addresses) {
    const key = addr.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(addr);
  }
  return result;
};

/**
 * Client-side mirror of the mail-server's `deriveReplyRecipients`. The backend
 * owns the reply's `to`, but the client still needs the same recipient list to
 * build the per-recipient encryption block, so this must stay 1:1 with the
 * server logic.
 *
 */
export const deriveReplyRecipients = (
  sourceMail: Pick<EmailResponse, 'from' | 'replyTo' | 'to' | 'cc'>,
  self: string,
  replyAll: boolean,
  extraCc: EmailAddress[] = [],
): ReplyRecipients => {
  const replyTo = sourceMail.replyTo ?? [];
  const from = sourceMail.from ?? [];

  const to = dedupeAddresses(replyTo.length ? replyTo : from).filter((a) => !sameAddress(a.email, self));

  const toEmails = new Set(to.map((a) => a.email.toLowerCase()));

  const replyAllCc = replyAll
    ? [...(sourceMail.to ?? []), ...(sourceMail.cc ?? [])].filter(
        (a) => !sameAddress(a.email, self) && !toEmails.has(a.email.toLowerCase()),
      )
    : [];

  const cc = dedupeAddresses([...replyAllCc, ...extraCc]).filter((a) => !toEmails.has(a.email.toLowerCase()));

  return { to, cc };
};
