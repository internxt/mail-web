import { useTranslationContext } from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { Avatar, Button, Input } from '@internxt/ui';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';

interface UpdateEmailProps {
  onBack: () => void;
  onNext: () => void;
}

// !TODO: Confirm password here directly (or maybe from onNext function)
export const ConfirmPassword = ({ onBack, onNext }: UpdateEmailProps) => {
  const { translate } = useTranslationContext();
  const [password, setPassword] = useState<string>('');
  const { user } = useAppSelector((state) => state.user);
  const userFullName = user ? `${user.name} ${user.lastname}` : 'My Internxt';

  const onConfirm = () => {
    console.log('onConfirm', password);
    onNext();
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

        {/* Email input */}
        <div className="flex flex-col w-full">
          <Input
            label={translate('identitySetup.confirmPassword.confirmPassword')}
            autofocus
            onChange={(e) => setPassword(e)}
            variant="password"
          />
        </div>

        <div className="flex flex-col w-full">
          <Button onClick={onConfirm}>{translate('identitySetup.confirmPassword.action')}</Button>
        </div>
      </div>
    </Fragment>
  );
};
