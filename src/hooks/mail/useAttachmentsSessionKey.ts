import { useEffect, useState } from 'react';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { MailEncryptionService } from '@/services/mail-encryption';
import { MailKeysService } from '@/services/mail-keys';

type CachedKey = { ok: true; key: Uint8Array } | { ok: false };

/**
 * Recovers and memoizes the symmetric session key used to decrypt every
 * attachment in an encrypted email. The unwrap is done once per `mailId`; the
 * cached result is reused across re-renders and across attachments within the
 * same email.
 */
export const useAttachmentsSessionKey = (
  mailId: string | null,
  envelope: EncryptionBlock | null,
): Uint8Array | null => {
  const keypair = MailKeysService.instance.getCurrentKeys();
  const address = MailKeysService.instance.getCurrentAddress();
  const [cache, setCache] = useState<Record<string, CachedKey>>({});

  useEffect(() => {
    if (!mailId || !envelope || !keypair || !address) return;
    if (cache[mailId]) return;

    let cancelled = false;
    MailEncryptionService.instance
      .decryptAttachmentsSessionKey(envelope, keypair, address)
      .then((key) => {
        if (!cancelled) setCache((prev) => ({ ...prev, [mailId]: { ok: true, key } }));
      })
      .catch((error) => {
        console.error('Failed to decrypt attachments session key', error);
        if (!cancelled) setCache((prev) => ({ ...prev, [mailId]: { ok: false } }));
      });

    return () => {
      cancelled = true;
    };
  }, [mailId, envelope, keypair, address, cache]);

  if (!mailId) return null;
  const entry = cache[mailId];
  return entry?.ok ? entry.key : null;
};
