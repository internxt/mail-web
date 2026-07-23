import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { MailService } from '@/services/sdk/mail';
import {
  isEmailAddressFormatValid,
  isRuleStatusValid,
  UNKNOWN_AVAILABILITY,
  validateEmailAddress,
  type AddressAvailability,
  type EmailAddressRule,
} from './emailAddressRules';

const DEFAULT_DEBOUNCE_MS = 500;

interface AvailabilityCheck {
  value: string;
  domain: string;
  result: AddressAvailability;
}

const fetchAvailability = async (username: string, domain: string): Promise<AddressAvailability> => {
  try {
    const { available, suggestion } = await MailService.instance.checkAddressAvailability(username, domain);
    return available ? { status: 'available' } : { status: 'taken', suggestion };
  } catch {
    return UNKNOWN_AVAILABILITY;
  }
};

export interface UseEmailAddressValidationResult {
  username: string;
  rules: EmailAddressRule[];
  isValid: boolean;
  canSubmit: boolean;
  availability: AddressAvailability;
  hasInteracted: boolean;
  validateAddress: (value: string) => void;
  checkAvailability: () => Promise<AddressAvailability>;
}

export const useEmailAddressValidation = (
  domain: string,
  debounceMs = DEFAULT_DEBOUNCE_MS,
): UseEmailAddressValidationResult => {
  const [username, setUsername] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [lastCheck, setLastCheck] = useState<AvailabilityCheck | null>(null);
  const debouncedUsername = useDebounce(username, debounceMs);
  const latestRequestIdRef = useRef(0);

  const validateAddress = useCallback((value: string) => {
    setHasInteracted(true);
    setUsername(value.toLowerCase());
  }, []);

  useEffect(() => {
    latestRequestIdRef.current++;
  }, [username, domain]);

  const checkAvailability = useCallback(async (): Promise<AddressAvailability> => {
    if (!isEmailAddressFormatValid(username)) return UNKNOWN_AVAILABILITY;

    const requestId = ++latestRequestIdRef.current;
    const result = await fetchAvailability(username, domain);
    if (requestId !== latestRequestIdRef.current) return UNKNOWN_AVAILABILITY;

    setLastCheck({ value: username, domain, result });

    return result;
  }, [username, domain]);

  useEffect(() => {
    if (!isEmailAddressFormatValid(debouncedUsername)) return;
    if (lastCheck && lastCheck.value === debouncedUsername && lastCheck.domain === domain) return;

    const requestId = ++latestRequestIdRef.current;
    void fetchAvailability(debouncedUsername, domain).then((result) => {
      if (requestId === latestRequestIdRef.current) {
        setLastCheck({ value: debouncedUsername, domain, result });
      }
    });
  }, [debouncedUsername, domain, lastCheck]);

  const availability: AddressAvailability = useMemo(() => {
    if (lastCheck && lastCheck.value === username && lastCheck.domain === domain) return lastCheck.result;
    return isEmailAddressFormatValid(username) ? { status: 'checking' } : UNKNOWN_AVAILABILITY;
  }, [lastCheck, username, domain]);

  const rules = useMemo(() => validateEmailAddress(debouncedUsername, availability), [debouncedUsername, availability]);
  const isValid = useMemo(() => rules.every((rule) => isRuleStatusValid(rule.status)), [rules]);
  const canSubmit = isEmailAddressFormatValid(username) && availability.status !== 'taken';

  return { username, rules, isValid, canSubmit, availability, hasInteracted, validateAddress, checkAvailability };
};
