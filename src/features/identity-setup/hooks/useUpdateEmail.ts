import { useTranslationContext } from '@/i18n';
import { ErrorService } from '@/services/error';
import type { EmailDomainsResponse } from '@internxt/sdk/dist/mail/types';
import { useState } from 'react';
import { useEmailAddressValidation } from './useEmailAddressValidation';

interface UseUpdateEmailParams {
  activeDomains: EmailDomainsResponse;
  onNext: (params: { address: string; domain: string }) => void;
}

export const useUpdateEmail = ({ activeDomains, onNext }: UseUpdateEmailParams) => {
  const { translate } = useTranslationContext();
  const [domain, setDomain] = useState<string>(activeDomains[0]?.domain ?? '');
  const { username, rules, isValid, canSubmit, validateAddress, checkAvailability } = useEmailAddressValidation(domain);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const availability = await checkAvailability();
      if (availability.status === 'available') {
        onNext({ address: username, domain });
      } else if (availability.status === 'unknown') {
        ErrorService.instance.notifyUser(translate('errors.identitySetup.availabilityCheckFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    void submit();
  };

  const hasStartedTyping = rules.some((rule) => rule.status !== 'idle');
  const isPanelVisible = isUsernameFocused || hasStartedTyping;

  return {
    username,
    rules,
    isValid,
    canSubmit,
    isSubmitting,
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
