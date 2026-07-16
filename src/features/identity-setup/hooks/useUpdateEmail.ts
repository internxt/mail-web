import type { EmailDomainsResponse } from '@internxt/sdk/dist/mail/types';
import { useState } from 'react';
import { useEmailAddressValidation } from './useEmailAddressValidation';

interface UseUpdateEmailParams {
  activeDomains: EmailDomainsResponse;
  onNext: (params: { address: string; domain: string }) => void;
}

export const useUpdateEmail = ({ activeDomains, onNext }: UseUpdateEmailParams) => {
  const { username, rules, isValid, validateAddress } = useEmailAddressValidation();
  const [domain, setDomain] = useState<string>(activeDomains[0]?.domain ?? '');
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);

  const submit = () => {
    if (!isValid) return;
    onNext({ address: username, domain });
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    submit();
  };

  const hasStartedTyping = rules.some((rule) => rule.status !== 'idle');
  const isPanelVisible = isUsernameFocused || hasStartedTyping;

  return {
    username,
    rules,
    isValid,
    validateAddress,
    domain,
    setDomain,
    isUsernameFocused,
    setIsUsernameFocused,
    isPanelVisible,
    handleSubmit,
    submit,
  };
};
