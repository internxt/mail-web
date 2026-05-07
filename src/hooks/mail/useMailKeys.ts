import type { HybridKeyPair } from 'internxt-crypto';
import { useGetMailAccountKeysQuery } from '@/store/api/mail';
import { MailKeysService } from '@/services/mail-keys';

export const useMailKeys = (): HybridKeyPair | null => {
  const { data } = useGetMailAccountKeysQuery();
  const address = data?.address;
  if (!address) return null;
  return MailKeysService.instance.get(address);
};
