import { useTranslationContext } from '@/i18n';
import type { EmailDomainsResponse } from '@internxt/sdk/dist/mail/types';
import { Avatar, Button } from '@internxt/ui';
import { useState } from 'react';
import { useEmailAddressValidation } from '../hooks/useEmailAddressValidation';
import { EmailAddressRulesPanel } from './EmailAddressRulesPanel';
import SelectMailInput from './SelectMailInput';

interface UpdateEmailProps {
  userFullName: string;
  activeDomains: EmailDomainsResponse;
  currentEmail: string;
  onNext: (params: { address: string; domain: string }) => void;
}

export const UpdateEmail = ({ userFullName, activeDomains, currentEmail, onNext }: UpdateEmailProps) => {
  const { translate, translateArray } = useTranslationContext();
  const { username, rules, isValid, validateAddress } = useEmailAddressValidation();
  const [domain, setDomain] = useState<string>(activeDomains[0]?.domain ?? '');
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  const descriptions = translateArray('identitySetup.updateEmail.description', {
    name: userFullName,
    current_email: currentEmail,
  });

  const handleConfirm = () => {
    if (!isValid) return;
    onNext({ address: username, domain });
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    handleConfirm();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter' || (e.target as HTMLElement).tagName === 'BUTTON') return;

    e.preventDefault();
    handleConfirm();
  };

  const hasStartedTyping = rules.some((rule) => rule.status !== 'idle');
  const isPanelVisible = isUsernameFocused || hasStartedTyping;

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className="flex flex-col gap-5 justify-center items-center"
    >
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
        <span className="mb-1 text-sm font-medium text-gray-100">{translate('identitySetup.updateEmail.mail')}</span>
        <SelectMailInput
          value={username}
          onChangeValue={validateAddress}
          selectedDomain={domain}
          domains={activeDomains}
          onChangeDomain={setDomain}
          onFocusChange={setIsUsernameFocused}
        />
        <div
          className={`grid transition-all duration-200 ease-out ${
            isPanelVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">{isPanelVisible && <EmailAddressRulesPanel rules={rules} />}</div>
        </div>
        {!isPanelVisible && <p className="text-sm text-gray-50">{translate('identitySetup.updateEmail.mailType')}</p>}
      </div>

      <div className="flex flex-col w-full">
        <Button type="submit" disabled={!isValid}>
          {translate('identitySetup.updateEmail.action')}
        </Button>
      </div>
    </form>
  );
};
