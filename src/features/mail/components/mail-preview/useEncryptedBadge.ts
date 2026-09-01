import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { useGetActiveDomainsQuery } from '@/store/api/mail';
import { isInternxtDomain } from '@/utils/domain';

interface UseEncryptedBadgeParams {
  isEncrypted?: boolean;
  decryptError?: boolean;
  envelope?: EncryptionBlock | null;
  collapsed: boolean;
}

export const useEncryptedBadge = ({
  isEncrypted,
  decryptError,
  envelope,
  collapsed,
}: UseEncryptedBadgeParams): boolean => {
  const { data: activeDomains } = useGetActiveDomainsQuery();

  if (collapsed || decryptError || !isEncrypted || !activeDomains?.length) return false;

  const wrappedKeys = envelope?.wrappedKeys;
  if (!wrappedKeys?.length) return false;

  return wrappedKeys.every((key) => isInternxtDomain(key.encryptedForEmail, activeDomains));
};
