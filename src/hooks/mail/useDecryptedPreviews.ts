import { useEffect, useRef, useState } from 'react';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';
import type { HybridKeyPair } from 'internxt-crypto';
import { useMailKeys } from './useMailKeys';
import { MailEncryptionService } from '@/services/mail-encryption';

type Summary = EmailListResponse['emails'][number];

const decryptPendingPreviews = async (pending: Summary[], keypair: HybridKeyPair): Promise<Record<string, string>> => {
  const resolved: Record<string, string> = {};
  for (const summary of pending) {
    try {
      resolved[summary.id] = await MailEncryptionService.instance.decryptSummaryPreview(summary.encryption!, keypair);
    } catch (error) {
      console.error('Failed to decrypt mail preview', { mailId: summary.id, error });
    }
  }
  return resolved;
};

/**
 * Decrypts the preview snippet for the encrypted rows on a list page. The
 * backend projects an `encryption` block ({ encryptedPreview, wrappedKeys })
 * onto each encrypted summary the caller can read; we trial-decrypt it with the
 * caller's keypair, exactly as the full body is decrypted.
 *
 * Returns a map of `emailId -> decrypted preview`. Rows are decrypted at most
 * once (tracked in `attempted`), so re-renders and pagination don't re-run the
 * crypto, and a row that fails simply stays absent
 */
export const useDecryptedPreviews = (summaries: Summary[] | undefined): Record<string, string> => {
  const keypair = useMailKeys();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const attempted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!keypair || !summaries?.length) return;

    const pending = summaries.filter((s) => s.encryption && !attempted.current.has(s.id));
    if (pending.length === 0) return;
    pending.forEach((s) => attempted.current.add(s.id));

    let cancelled = false;
    decryptPendingPreviews(pending, keypair).then((resolved) => {
      if (!cancelled && Object.keys(resolved).length) {
        setPreviews((prev) => ({ ...prev, ...resolved }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [summaries, keypair]);

  return previews;
};
