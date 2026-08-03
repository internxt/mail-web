import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { ErrorService } from '@/services/error';
import { MailService } from '@/services/sdk/mail';
import {
  isEmailAddressFormatValid,
  isRuleStatusValid,
  UNKNOWN_AVAILABILITY,
  validateEmailAddress,
  type AddressAvailability,
  type EmailAddressRule,
} from './emailAddressRules';

export const DEFAULT_DEBOUNCE_MS = 600;
const RATE_LIMIT_STATUS = 429;

interface ResolvedAvailability {
  key: string;
  result: AddressAvailability;
}

const cacheKey = (username: string, domain: string): string => `${username}@${domain}`;

const isDefinitiveAvailability = (availability: AddressAvailability): boolean =>
  availability.status === 'available' || availability.status === 'taken';

const fetchAvailability = async (username: string, domain: string): Promise<AddressAvailability> => {
  try {
    const { available, suggestion } = await MailService.instance.checkAddressAvailability(username, domain);
    return available ? { status: 'available' } : { status: 'taken', suggestion };
  } catch (error) {
    if (ErrorService.instance.castError(error).status === RATE_LIMIT_STATUS) {
      return { status: 'rateLimited' };
    }
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
  const [resolved, setResolved] = useState<ResolvedAvailability | null>(null);
  const debouncedUsername = useDebounce(username, debounceMs);

  const cacheRef = useRef<Map<string, AddressAvailability>>(new Map());
  const latestRequestIdRef = useRef(0);

  const validateAddress = useCallback((value: string) => {
    setHasInteracted(true);
    setUsername(value.toLowerCase());
  }, []);

  useEffect(() => {
    latestRequestIdRef.current++;
  }, [username, domain]);

  const resolveAvailability = useCallback(
    async (value: string): Promise<AddressAvailability> => {
      const key = cacheKey(value, domain);

      const cached = cacheRef.current.get(key);
      if (cached) {
        setResolved({ key, result: cached });
        return cached;
      }

      const requestId = ++latestRequestIdRef.current;
      const result = await fetchAvailability(value, domain);
      if (isDefinitiveAvailability(result)) cacheRef.current.set(key, result);
      if (requestId === latestRequestIdRef.current) setResolved({ key, result });

      return result;
    },
    [domain],
  );

  useEffect(() => {
    if (!isEmailAddressFormatValid(debouncedUsername)) return;
    void resolveAvailability(debouncedUsername);
  }, [debouncedUsername, resolveAvailability]);

  const availability: AddressAvailability = useMemo(() => {
    if (!isEmailAddressFormatValid(username)) return UNKNOWN_AVAILABILITY;
    if (resolved?.key === cacheKey(username, domain)) return resolved.result;
    return { status: 'checking' };
  }, [username, domain, resolved]);

  const rules = useMemo(() => validateEmailAddress(debouncedUsername, availability), [debouncedUsername, availability]);
  const isValid = useMemo(() => rules.every((rule) => isRuleStatusValid(rule.status)), [rules]);
  const canSubmit = isEmailAddressFormatValid(username) && availability.status !== 'taken';

  const checkAvailability = useCallback(async (): Promise<AddressAvailability> => {
    if (!isEmailAddressFormatValid(username)) return UNKNOWN_AVAILABILITY;
    return resolveAvailability(username);
  }, [username, resolveAvailability]);

  return { username, rules, isValid, canSubmit, availability, hasInteracted, validateAddress, checkAvailability };
};
