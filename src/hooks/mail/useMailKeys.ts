import type { HybridKeyPair } from 'internxt-crypto';
import { useAppSelector } from '@/store/hooks';
import { MailKeysService } from '@/services/mail-keys';

export const useMailKeys = (): HybridKeyPair | null => {
  const userEmail = useAppSelector((state) => state.user.user?.email);
  if (!userEmail) return null;
  return MailKeysService.instance.get(userEmail);
};
