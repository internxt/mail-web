import { useTranslationContext } from '@/i18n';
import { Avatar, Button, Input } from '@internxt/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';

interface ConfirmPasswordProps {
  userFullName: string;
  onBack: () => void;
  onNext: (password: string) => Promise<void>;
}

export const ConfirmPassword = ({ userFullName, onBack, onNext }: ConfirmPasswordProps) => {
  const { translate } = useTranslationContext();
  const [password, setPassword] = useState<string>('');

  const onConfirmPassword = async () => {
    onNext(password);
  };

  return (
    <Fragment>
      <div>
        <Button onClick={onBack} variant="ghost">
          <div className="flex flex-row gap-2 items-center text-primary">
            <ArrowLeftIcon size={18} />
            {translate('identitySetup.confirmPassword.goBack')}
          </div>
        </Button>
      </div>
      <div className="flex flex-col gap-5 justify-center items-center">
        {/* Avatar */}
        <div className="flex flex-col">
          <Avatar fullName={userFullName} diameter={80} />
        </div>

        {/* Title and description */}
        <div className="flex flex-col text-center">
          <h1 className="text-2xl font-medium text-gray-100">{translate('identitySetup.confirmPassword.title')}</h1>
          <div className="flex flex-col gap-1">
            <p className="text-gray-80">{translate('identitySetup.confirmPassword.description')}</p>
          </div>
        </div>
        <div className="flex border w-full border-gray-10" />

        {/* Password input */}
        <div className="flex flex-col w-full">
          <Input
            label={translate('identitySetup.confirmPassword.confirmPassword')}
            autofocus
            onChange={(e) => setPassword(e)}
            variant="password"
          />
        </div>

        <div className="flex flex-col w-full">
          <Button onClick={onConfirmPassword}>{translate('identitySetup.confirmPassword.action')}</Button>
        </div>
      </div>
    </Fragment>
  );
};
