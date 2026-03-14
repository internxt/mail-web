import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useState, type ReactNode } from 'react';
import { UpdateEmail } from './components/UpdateEmail';
import { ConfirmPassword } from './components/ConfirmPassword';
import { useAppSelector } from '@/store/hooks';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { ConfirmChange } from './components/ConfirmChange';

type Step = 'updateEmail' | 'confirmPassword' | 'confirmChange';

const IdentitySetup = () => {
  const [step, setStep] = useState<Step>('updateEmail');
  const { user } = useAppSelector((state) => state.user);
  const userFullName = user ? `${user.name} ${user.lastname}` : 'My Internxt';
  const [newEmail, setNewEmail] = useState('');

  const onConfirmChange = () => {
    NavigationService.instance.replace({ id: AppView.Inbox });
  };

  const stepContent: Record<Step, ReactNode> = {
    updateEmail: (
      <UpdateEmail
        userFullName={userFullName}
        currentEmail={user?.email as string}
        onNext={(email) => {
          setNewEmail(email);
          setStep('confirmPassword');
        }}
      />
    ),
    confirmPassword: <ConfirmPassword onNext={() => setStep('confirmChange')} onBack={() => setStep('updateEmail')} />,
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
