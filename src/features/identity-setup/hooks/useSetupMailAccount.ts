import { useState } from 'react';
import { createEncryptionAndRecoveryKeystores } from 'internxt-crypto';
import type { SetupMailAccountPayload } from '@internxt/sdk/dist/mail/types';
import { useTranslationContext } from '@/i18n';
import { AppView } from '@/routes/paths';
import { CryptoService } from '@/services/crypto';
import { ErrorService } from '@/services/error';
import { LocalStorageService } from '@/services/local-storage';
import { NavigationService } from '@/services/navigation';
import { ToastType } from '@/services/notifications';
import { MailService } from '@/services/sdk/mail';
import { mailApi } from '@/store/api/mail';
import { paymentsApi } from '@/store/api/payments';
import { useAppDispatch } from '@/store/hooks';

interface UseSetupMailAccountParams {
  userFullName: string;
}

interface SetupMailAccountParams {
  address: string;
  domain: string;
  hashedPassword: string;
}

export const useSetupMailAccount = ({ userFullName }: UseSetupMailAccountParams) => {
  const { translate } = useTranslationContext();
  const dispatch = useAppDispatch();
  const [isConfirmingChange, setIsConfirmingChange] = useState<boolean>(false);

  const setupMailAccount = async ({ address, domain, hashedPassword }: SetupMailAccountParams) => {
    setIsConfirmingChange(true);

    try {
      const mailboxEmail = `${address}@${domain}`;
      const mnemonic = LocalStorageService.instance.getMnemonic();

      if (!mnemonic) {
        ErrorService.instance.notifyUser(translate('errors.identitySetup.setupFailed'));
        return;
      }

      const { encryptionKeystore, recoveryKeystore } = await createEncryptionAndRecoveryKeystores(
        mailboxEmail,
        mnemonic,
      );

      const confirmIdentitySetupPayload: SetupMailAccountPayload = {
        address,
        displayName: userFullName,
        domain,
        password: CryptoService.instance.encryptTextWithKey(hashedPassword),
        keys: {
          publicKey: encryptionKeystore.publicKey,
          encryptionPrivateKey: encryptionKeystore.privateKeyEncrypted,
          recoveryPrivateKey: recoveryKeystore.privateKeyEncrypted,
        },
      };

      await MailService.instance.setupMailAccount(confirmIdentitySetupPayload);
      dispatch(mailApi.util.invalidateTags(['MailAccountKeys']));
      NavigationService.instance.replace({ id: AppView.Inbox });
    } catch (error) {
      const err = ErrorService.instance.castError(error);

      if (err.status === 403) {
        ErrorService.instance.notifyUser(translate('errors.identitySetup.planNotSupported'), ToastType.Warning);
        dispatch(paymentsApi.util.invalidateTags(['UserTier']));
        NavigationService.instance.replace({
          id: AppView.Welcome,
          options: { state: { planAlreadyNotified: true } },
        });
        return;
      }

      ErrorService.instance.notifyUser(translate('errors.identitySetup.setupFailed'));
    } finally {
      setIsConfirmingChange(false);
    }
  };

  return { isConfirmingChange, setupMailAccount };
};
