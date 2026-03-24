import { useTranslationContext } from '@/i18n';
import { Avatar, Button } from '@internxt/ui';
import { useState } from 'react';
import SelectMailInput, { type Domain } from './SelectMailInput';

interface UpdateEmailProps {
  onNext: (email: string) => void;
  userFullName: string;
  currentEmail: string;
}

export const UpdateEmail = ({ userFullName, currentEmail, onNext }: UpdateEmailProps) => {
  const { translate, translateArray } = useTranslationContext();
  const [username, setUsername] = useState<string>('');
  const [domain, setDomain] = useState<Domain>('@intx.me');

  const descriptions = translateArray('identitySetup.updateEmail.description', {
    name: userFullName,
    current_email: currentEmail,
  });

  const fullEmail = `${username}${domain}`;

  const handleOnClick = () => {
    onNext(fullEmail);
  };

  return (
    <div className="flex flex-col gap-5 justify-center items-center">
      {/* Avatar */}
      <div className="flex flex-col">
        <Avatar fullName={userFullName} diameter={80} />
      </div>

      {/* Title and description */}
      <div className="flex flex-col text-center">
        <h1 className="text-2xl font-medium text-gray-100">{translate('identitySetup.updateEmail.title')}</h1>
        <div className="flex flex-col gap-1">
          {descriptions.map((description) => (
            <p key={description} className="text-gray-80">
              {description}
            </p>
          ))}
        </div>
      </div>
      <div className="flex border w-full border-gray-10" />

      {/* Email input */}
      <div className="flex flex-col w-full">
        <SelectMailInput
          value={username}
          onChangeValue={setUsername}
          selectedDomain={domain}
          onChangeDomain={setDomain}
        />
        <p className="text-sm text-gray-50">{translate('identitySetup.updateEmail.mailType')}</p>
      </div>

      <div className="flex flex-col w-full">
        <Button onClick={handleOnClick}>{translate('identitySetup.updateEmail.action')}</Button>
      </div>
    </div>
  );
};
