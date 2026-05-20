import { useEffect, useMemo, useState } from 'react';
import type { EmailResponse } from '@internxt/sdk/dist/mail/types';
import { useMailKeys } from './useMailKeys';
import { useGetMailAccountKeysQuery } from '@/store/api/mail';
import { decryptEnvelope, isEncryptedEmailBody, parseEncryptionBlock } from '@/services/mail-encryption';

type State = {
  subject: string;
  htmlBody: string;
  isEncrypted: boolean;
  isDecrypting: boolean;
  decryptError: boolean;
};

const EMPTY: State = {
  subject: '',
  htmlBody: '',
  isEncrypted: false,
  isDecrypting: false,
  decryptError: false,
};

type CachedResult = { mailId: string; ok: true; subject: string; text: string } | { mailId: string; ok: false };

export const useDecryptedMail = (mail: EmailResponse | undefined): State => {
  const senderKeys = useMailKeys();
  const { data: account } = useGetMailAccountKeysQuery();

  const isEncrypted = mail ? isEncryptedEmailBody(mail.textBody) : false;
  const canDecrypt = Boolean(isEncrypted && senderKeys && account?.address);

  const [cached, setCached] = useState<CachedResult | null>(null);

  useEffect(() => {
    if (!canDecrypt || !mail || !senderKeys || !account?.address) return;

    let cancelled = false;
    (async () => {
      try {
        const envelope = parseEncryptionBlock(mail.textBody as string);
        const plaintext = await decryptEnvelope(envelope, account.address, senderKeys);
        if (!cancelled) {
          setCached({ mailId: mail.id, ok: true, subject: plaintext.subject, text: plaintext.text });
        }
      } catch {
        if (!cancelled) setCached({ mailId: mail.id, ok: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canDecrypt, mail, senderKeys, account?.address]);

  return useMemo<State>(() => {
    if (!mail) return EMPTY;

    if (!isEncrypted) {
      return {
        subject: mail.subject,
        htmlBody: mail.htmlBody ?? '',
        isEncrypted: false,
        isDecrypting: false,
        decryptError: false,
      };
    }

    const fresh = cached && cached.mailId === mail.id ? cached : null;

    if (!fresh) {
      return { subject: mail.subject, htmlBody: '', isEncrypted: true, isDecrypting: true, decryptError: false };
    }

    if (!fresh.ok) {
      return { subject: mail.subject, htmlBody: '', isEncrypted: true, isDecrypting: false, decryptError: true };
    }

    return {
      subject: fresh.subject,
      htmlBody: fresh.text,
      isEncrypted: true,
      isDecrypting: false,
      decryptError: false,
    };
  }, [mail, isEncrypted, cached]);
};
