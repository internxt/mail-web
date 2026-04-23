import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { use, useState, type ReactNode } from 'react';
import { UpdateEmail } from './components/UpdateEmail';
import { ConfirmPassword } from './components/ConfirmPassword';
import { useAppSelector } from '@/store/hooks';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { ConfirmChange } from './components/ConfirmChange';
import { MailService } from '@/services/sdk/mail';
import { AuthService } from '@/services/sdk/auth';
import { ErrorService } from '@/services/error';
import type { SetupMailAccountPayload } from '@internxt/sdk';
import { CryptoService } from '@/services/crypto';
import { useTranslationContext } from '@/i18n';
import { DEFAULT_USER_NAME } from '@/constants';
import { createEncryptionAndRecoveryKeystores, uint8ArrayToBase64 } from 'internxt-crypto';

type Step = 'updateEmail' | 'confirmPassword' | 'confirmChange';

const activeDomainsPromise = MailService.instance.getActiveDomains();
const IdentitySetup = () => {
  const activeDomains = use(activeDomainsPromise);
  const { translate } = useTranslationContext();
  const [newEmail, setNewEmail] = useState({
    address: '',
    domain: '',
  });
  const [isConfirmingChange, setIsConfirmingChange] = useState<boolean>(false);
  const [hashedPassword, setHashedPassword] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [step, setStep] = useState<Step>('updateEmail');
  const { user } = useAppSelector((state) => state.user);
  const currentEmail = user?.email ?? '';
  const userFullName = user ? `${user.name} ${user.lastname}` : DEFAULT_USER_NAME;

  const onConfirmPassword = async (password: string) => {
    try {
      if (!newEmail.address || !newEmail.domain) {
        ErrorService.instance.notifyUser(translate('errors.identitySetup.emailNotSelected'));
        return;
      }

      const { areValidCredentials, hashedPassword } = await AuthService.instance.areCredentialsCorrect(password);

      if (!areValidCredentials) {
        ErrorService.instance.notifyUser(translate('errors.identitySetup.passwordWrong'));
        return;
      }

      setHashedPassword(hashedPassword);
      setUserPassword(password);
      setStep('confirmChange');
    } catch {
      ErrorService.instance.notifyUser(translate('errors.identitySetup.passwordCheckFailed'));
    }
  };

  const onConfirmChange = async () => {
    setIsConfirmingChange(true);

    try {
      const mailboxEmail = `${newEmail.address}@${newEmail.domain}`;
      const { encryptionKeystore, recoveryKeystore, salt } = await createEncryptionAndRecoveryKeystores(
        mailboxEmail,
        userPassword,
      );

      const confirmIdentitySetupPayload: SetupMailAccountPayload = {
        address: newEmail.address,
        displayName: userFullName,
        domain: newEmail.domain,
        password: CryptoService.instance.encryptTextWithKey(hashedPassword),
        keys: {
          publicKey: encryptionKeystore.publicKey,
          encryptionPrivateKey: encryptionKeystore.privateKeyEncrypted,
          recoveryPrivateKey: recoveryKeystore.privateKeyEncrypted,
          salt: uint8ArrayToBase64(salt),
        },
      };

      await MailService.instance.setupMailAccount(confirmIdentitySetupPayload);
      NavigationService.instance.replace({ id: AppView.Inbox });
    } catch {
      ErrorService.instance.notifyUser(translate('errors.identitySetup.setupFailed'));
    } finally {
      setIsConfirmingChange(false);
    }
  };

  const stepContent: Record<Step, ReactNode> = {
    updateEmail: (
      <UpdateEmail
        userFullName={userFullName}
        activeDomains={activeDomains}
        currentEmail={currentEmail}
        onNext={(email) => {
          setNewEmail(email);
          setStep('confirmPassword');
        }}
      />
    ),
    confirmPassword: (
      <ConfirmPassword userFullName={userFullName} onNext={onConfirmPassword} onBack={() => setStep('updateEmail')} />
    ),
    confirmChange: (
      <ConfirmChange
        userFullName={userFullName}
        userNewEmail={newEmail}
        userOldEmail={currentEmail}
        isLoading={isConfirmingChange}
        isDisabled={isConfirmingChange || !newEmail.address || !newEmail.domain}
        onConfirmChanges={onConfirmChange}
      />
    ),
  };

  return (
    <div className="flex flex-col w-screen h-screen justify-between py-10 bg-gray-1">
      <Header />
      <div className="flex flex-col items-center w-full justify-center">
        <div className="flex flex-col max-w-96 rounded-2xl bg-surface border border-gray-10 p-8 gap-5 shadow-subtle">
          {stepContent[step]}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default IdentitySetup;
