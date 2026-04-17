import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { use, useEffect, useState, type ReactNode } from 'react';
import { UpdateEmail } from './components/UpdateEmail';
import { ConfirmPassword } from './components/ConfirmPassword';
import { useAppSelector } from '@/store/hooks';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { ConfirmChange } from './components/ConfirmChange';
import { useThemeContext } from '@/context/theme/useThemeContext';
import { MailService } from '@/services/sdk/mail';
import { AuthService } from '@/services/sdk/auth';
import { ErrorService } from '@/services/error';
import type { SetupMailAccountPayload } from '@internxt/sdk';

type Step = 'updateEmail' | 'confirmPassword' | 'confirmChange';

const activeDomainsPromise = MailService.instance.getActiveDomains();
const IdentitySetup = () => {
  const { currentTheme, toggleTheme } = useThemeContext();
  const [newEmail, setNewEmail] = useState({
    address: '',
    domain: '',
  });
  const [hashedPassword, setHashedPassword] = useState<string>('');
  const [step, setStep] = useState<Step>('updateEmail');
  const { user } = useAppSelector((state) => state.user);
  const userFullName = user ? `${user.name} ${user.lastname}` : 'My Internxt';
  const activeDomains = use(activeDomainsPromise);

  useEffect(() => {
    const previousTheme = currentTheme;
    toggleTheme('light');
    return () => {
      if (previousTheme) toggleTheme(previousTheme);
    };
  }, []);

  const onConfirmPassword = async (password: string) => {
    try {
      if (!newEmail.address || !newEmail.domain) {
        ErrorService.instance.notifyUser('Please choose an email');
        return;
      }

      const { areValidCredentials, hashedPassword } = await AuthService.instance.areCredentialsCorrect(password);

      if (!areValidCredentials) {
        ErrorService.instance.notifyUser('Incorrect password');
        return;
      }

      setHashedPassword(hashedPassword);
      setStep('confirmChange');
    } catch (e) {
      console.error('ERROR WHILE CHECKING THE USER PASSWORD: ', e);
      ErrorService.instance.notifyUser('Error while checking the user password');
    }
  };

  const onConfirmChange = async () => {
    const confirmIdentitySetupPayload: SetupMailAccountPayload = {
      address: newEmail.address,
      displayName: userFullName,
      domain: newEmail.domain,
      password: hashedPassword,
    };

    try {
      NavigationService.instance.replace({ id: AppView.Inbox });
      await MailService.instance.setupMailAccount(confirmIdentitySetupPayload);
    } catch (error) {
      console.error('ERROR WHILE CONFIRMING IDENTITY SETUP: ', error);
      ErrorService.instance.notifyUser('Error while confirming identity setup');
    }
  };

  const stepContent: Record<Step, ReactNode> = {
    updateEmail: (
      <UpdateEmail
        userFullName={userFullName}
        activeDomains={activeDomains}
        currentEmail={user?.email as string}
        onNext={(email) => {
          setNewEmail(email);
          setStep('confirmPassword');
        }}
      />
    ),
    confirmPassword: <ConfirmPassword onNext={onConfirmPassword} onBack={() => setStep('updateEmail')} />,
    confirmChange: (
      <ConfirmChange
        userFullName={userFullName}
        userNewEmail={newEmail}
        userOldEmail={user?.email as string}
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
