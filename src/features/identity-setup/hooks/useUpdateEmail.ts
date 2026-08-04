import { useTranslationContext } from '@/i18n';
import { ErrorService } from '@/services/error';
import type { EmailDomainsResponse } from '@internxt/sdk/dist/mail/types';
import { useRef, useState } from 'react';
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
  const isSubmittingRef = useRef(false);

  const submit = async () => {
    if (!canSubmit || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const availability = await checkAvailability();
      switch (availability.status) {
        case 'available':
          onNext({ address: username, domain });
          return;
        case 'taken':
          return;
        case 'rateLimited':
          ErrorService.instance.notifyUser(translate('errors.identitySetup.availabilityCheckRateLimited'));
          return;
        default:
          ErrorService.instance.notifyUser(translate('errors.identitySetup.availabilityCheckFailed'));
      }
    } finally {
      isSubmittingRef.current = false;
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
