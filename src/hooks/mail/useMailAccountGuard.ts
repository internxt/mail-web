import { useEffect, useRef, useState } from 'react';
import { KeystoreType, openEncryptionKeystore } from 'internxt-crypto';
import { useGetMailAccountKeysQuery } from '@/store/api/mail';
import { MailNotSetupError } from '@/errors';
import { LocalStorageService } from '@/services/local-storage';
import { MailKeysService } from '@/services/mail-keys';

export type MailAccountGuardStatus = 'loading' | 'ready' | 'not-setup' | 'error';

export const useMailAccountGuard = (): { status: MailAccountGuardStatus } => {
  const { data, error, isLoading, isFetching } = useGetMailAccountKeysQuery();
  const lastStartedAddress = useRef<string | null>(null);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptError, setDecryptError] = useState(false);

  const address = data?.address;
  const publicKey = data?.publicKey;
  const encryptionPrivateKey = data?.encryptionPrivateKey;

  useEffect(() => {
    if (!address || !publicKey || !encryptionPrivateKey) return;
    if (lastStartedAddress.current === address && !decryptError) return;

    lastStartedAddress.current = address;

    const decrypt = async () => {
      setIsDecrypted(false);
      setDecryptError(false);

      const cached = MailKeysService.instance.get(address);
      if (cached) {
        setIsDecrypted(true);
        return;
      }

      const mnemonic = LocalStorageService.instance.getMnemonic();
      if (!mnemonic) {
        lastStartedAddress.current = null;
        setDecryptError(true);
        return;
      }

      try {
        const keys = await openEncryptionKeystore(
          {
            userEmail: address,
            type: KeystoreType.ENCRYPTION,
            publicKey,
            privateKeyEncrypted: encryptionPrivateKey,
          },
          mnemonic,
        );
        MailKeysService.instance.set(address, keys);
        setIsDecrypted(true);
      } catch {
        lastStartedAddress.current = null;
        setDecryptError(true);
      }
    };

    void decrypt();
  }, [address, publicKey, encryptionPrivateKey, decryptError]);

  if (isLoading || isFetching) return { status: 'loading' };
  if (error instanceof MailNotSetupError) return { status: 'not-setup' };
  if (error || decryptError) return { status: 'error' };
  if (isDecrypted) return { status: 'ready' };
  return { status: 'loading' };
};
