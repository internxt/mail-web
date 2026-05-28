import { useEffect, useMemo, useState } from 'react';
import type { EmailResponse } from '@internxt/sdk/dist/mail/types';
import type { HybridKeyPair } from 'internxt-crypto';
import { useMailKeys } from './useMailKeys';
import { MailEncryptionService } from '@/services/mail-encryption';

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

type CachedResult = { ok: true; text: string } | { ok: false };

const decryptMailBody = async (mail: EmailResponse, senderKeys: HybridKeyPair): Promise<CachedResult> => {
  try {
    const envelope = MailEncryptionService.instance.parseEncryptionBlock(mail.textBody as string);
    const text = await MailEncryptionService.instance.decryptEnvelope(envelope, senderKeys);
    return { ok: true, text };
  } catch (error) {
    console.error('Failed to decrypt mail body', error);
    return { ok: false };
  }
};

export const useDecryptedMail = (mail: EmailResponse | undefined): State => {
  const senderKeys = useMailKeys();

  const isEncrypted = mail ? MailEncryptionService.instance.isEncryptedEmailBody(mail.textBody) : false;
  const canDecrypt = Boolean(isEncrypted && senderKeys);

  const [cached, setCached] = useState<Record<string, CachedResult>>({});

  useEffect(() => {
    if (!canDecrypt || !mail || !senderKeys) return;
    if (cached[mail.id]) return;

    let cancelled = false;
    decryptMailBody(mail, senderKeys).then((result) => {
      if (!cancelled) setCached((prev) => ({ ...prev, [mail.id]: result }));
    });

    return () => {
      cancelled = true;
    };
  }, [canDecrypt, mail, senderKeys, cached]);

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

    const fresh = cached[mail.id] ?? null;

    if (!fresh) {
      return { subject: mail.subject, htmlBody: '', isEncrypted: true, isDecrypting: true, decryptError: false };
    }

    if (!fresh.ok) {
      return { subject: mail.subject, htmlBody: '', isEncrypted: true, isDecrypting: false, decryptError: true };
    }

    return {
      subject: mail.subject,
      htmlBody: fresh.text,
      isEncrypted: true,
      isDecrypting: false,
      decryptError: false,
    };
  }, [mail, isEncrypted, cached]);
};
