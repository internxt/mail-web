import { DEFAULT_USER_NAME } from '@/constants';
import { useTranslationContext } from '@/i18n';
import { ErrorService } from '@/services/error';
import { AuthService } from '@/services/sdk/auth';
import { MailService } from '@/services/sdk/mail';
import { useAppSelector } from '@/store/hooks';
import { use, useState, type ReactNode } from 'react';
import { ConfirmChange } from './components/ConfirmChange';
import { ConfirmPassword } from './components/ConfirmPassword';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { UpdateEmail } from './components/UpdateEmail';
import { useSetupMailAccount } from './hooks/useSetupMailAccount';

type Step = 'updateEmail' | 'confirmPassword' | 'confirmChange';

const activeDomainsPromise = MailService.instance.getActiveDomains();
const IdentitySetup = () => {
  const activeDomains = use(activeDomainsPromise);
  const { translate } = useTranslationContext();
  const [newEmail, setNewEmail] = useState({
    address: '',
    domain: '',
  });
  const [hashedPassword, setHashedPassword] = useState<string>('');
  const [step, setStep] = useState<Step>('updateEmail');
  const { user } = useAppSelector((state) => state.user);
  const currentEmail = user?.email ?? '';
  const userFullName = user ? `${user.name} ${user.lastname}` : DEFAULT_USER_NAME;
  const { isConfirmingChange, setupMailAccount } = useSetupMailAccount({ userFullName });

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
      setStep('confirmChange');
    } catch {
      ErrorService.instance.notifyUser(translate('errors.identitySetup.passwordCheckFailed'));
    }
  };

  const onConfirmChange = () => setupMailAccount({ ...newEmail, hashedPassword });

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
