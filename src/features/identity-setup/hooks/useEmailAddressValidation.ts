import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { isRuleStatusValid, validateEmailAddress, type EmailAddressRule } from './emailAddressRules';

const DEFAULT_DEBOUNCE_MS = 300;

export interface UseEmailAddressValidationResult {
  username: string;
  rules: EmailAddressRule[];
  isValid: boolean;
  hasInteracted: boolean;
  validateAddress: (value: string) => void;
}

export const useEmailAddressValidation = (debounceMs = DEFAULT_DEBOUNCE_MS): UseEmailAddressValidationResult => {
  const [username, setUsername] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const debouncedUsername = useDebounce(username, debounceMs);

  const validateAddress = useCallback((value: string) => {
    setHasInteracted(true);
    setUsername(value.toLowerCase());
  }, []);

  const rules = useMemo(() => validateEmailAddress(debouncedUsername), [debouncedUsername]);
  const isValid = useMemo(() => rules.every((rule) => isRuleStatusValid(rule.status)), [rules]);

  return { username, rules, isValid, hasInteracted, validateAddress };
};
