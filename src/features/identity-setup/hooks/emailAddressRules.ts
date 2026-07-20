import type { TranslationKey } from '@/i18n/types';

export const EMAIL_ADDRESS_MIN_LENGTH = 3;
export const EMAIL_ADDRESS_MAX_LENGTH = 30;

const ALLOWED_CHARS_REGEX = /^[a-z0-9._-]+$/;
const EDGE_SPECIAL_CHARS_REGEX = /^[._-]|[._-]$/;
const CONSECUTIVE_SPECIAL_CHARS_REGEX = /[._-]{2,}/;

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'support',
  'postmaster',
  'noreply',
  'no-reply',
  'webmaster',
  'hostmaster',
  'abuse',
  'security',
  'info',
  'help',
  'contact',
  'billing',
  'sales',
  'mailer-daemon',
  'daemon',
  'ftp',
  'www',
  'system',
  'test',
]);

export type EmailAddressRuleId = 'length' | 'charset' | 'edges' | 'available';
export type EmailAddressRuleStatus = 'idle' | 'valid' | 'invalid';

export type AddressAvailability =
  | { status: 'unknown' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'taken'; suggestion: string | null };

export const UNKNOWN_AVAILABILITY: AddressAvailability = { status: 'unknown' };

export interface EmailAddressRule {
  id: EmailAddressRuleId;
  labelKey: TranslationKey;
  labelParams?: Record<string, string>;
  status: EmailAddressRuleStatus;
}

const isLengthValid = (username: string): boolean =>
  username.length >= EMAIL_ADDRESS_MIN_LENGTH && username.length <= EMAIL_ADDRESS_MAX_LENGTH;

const isCharsetValid = (username: string): boolean =>
  ALLOWED_CHARS_REGEX.test(username) && !CONSECUTIVE_SPECIAL_CHARS_REGEX.test(username);

const isEdgesValid = (username: string): boolean => !EDGE_SPECIAL_CHARS_REGEX.test(username);

const isReserved = (username: string): boolean => RESERVED_USERNAMES.has(username);

export const isEmailAddressFormatValid = (username: string): boolean =>
  isLengthValid(username) && isCharsetValid(username) && isEdgesValid(username) && !isReserved(username);

const availabilityRule = (
  username: string,
  formatValid: boolean,
  availability: AddressAvailability,
): EmailAddressRule => {
  const base = { id: 'available', labelKey: 'identitySetup.updateEmail.rules.available' } as const;

  if (!formatValid) {
    return { ...base, status: isReserved(username) ? 'invalid' : 'idle' };
  }

  switch (availability.status) {
    case 'available':
      return { ...base, status: 'valid' };
    case 'taken':
      return availability.suggestion
        ? {
            ...base,
            labelKey: 'identitySetup.updateEmail.rules.taken',
            labelParams: { suggestion: availability.suggestion },
            status: 'invalid',
          }
        : { ...base, labelKey: 'identitySetup.updateEmail.rules.takenNoSuggestion', status: 'invalid' };
    default:
      return { ...base, status: 'idle' };
  }
};

export const validateEmailAddress = (
  username: string,
  availability: AddressAvailability = UNKNOWN_AVAILABILITY,
): EmailAddressRule[] => {
  const hasContent = username.length > 0;
  const lengthValid = isLengthValid(username);
  const charsetValid = isCharsetValid(username);
  const edgesValid = hasContent && isEdgesValid(username);
  const formatValid = lengthValid && charsetValid && edgesValid && !isReserved(username);

  return [
    {
      id: 'length',
      labelKey: 'identitySetup.updateEmail.rules.length',
      status: hasContent ? (lengthValid ? 'valid' : 'invalid') : 'idle',
    },
    {
      id: 'charset',
      labelKey: 'identitySetup.updateEmail.rules.charset',
      status: hasContent ? (charsetValid ? 'valid' : 'invalid') : 'idle',
    },
    {
      id: 'edges',
      labelKey: 'identitySetup.updateEmail.rules.edges',
      status: hasContent ? (edgesValid ? 'valid' : 'invalid') : 'idle',
    },
    availabilityRule(username, formatValid, availability),
  ];
};

export const isRuleStatusValid = (status: EmailAddressRuleStatus): boolean => status === 'valid';

export const isEmailAddressValid = (username: string, availability?: AddressAvailability): boolean =>
  validateEmailAddress(username, availability).every((rule) => isRuleStatusValid(rule.status));
