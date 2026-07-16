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

export interface EmailAddressRule {
  id: EmailAddressRuleId;
  labelKey: TranslationKey;
  status: EmailAddressRuleStatus;
}

const isLengthValid = (username: string): boolean =>
  username.length >= EMAIL_ADDRESS_MIN_LENGTH && username.length <= EMAIL_ADDRESS_MAX_LENGTH;

const isCharsetValid = (username: string): boolean =>
  ALLOWED_CHARS_REGEX.test(username) && !CONSECUTIVE_SPECIAL_CHARS_REGEX.test(username);

const isEdgesValid = (username: string): boolean => !EDGE_SPECIAL_CHARS_REGEX.test(username);

const isAvailable = (username: string): boolean => !RESERVED_USERNAMES.has(username);

export const validateEmailAddress = (username: string): EmailAddressRule[] => {
  const hasContent = username.length > 0;
  const lengthValid = isLengthValid(username);
  const charsetValid = isCharsetValid(username);
  const edgesValid = hasContent && isEdgesValid(username);
  const formatValid = lengthValid && charsetValid && edgesValid;

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
    {
      id: 'available',
      labelKey: 'identitySetup.updateEmail.rules.available',
      status: formatValid ? (isAvailable(username) ? 'valid' : 'invalid') : 'idle',
    },
  ];
};

export const isRuleStatusValid = (status: EmailAddressRuleStatus): boolean => status === 'valid';

export const isEmailAddressValid = (username: string): boolean =>
  validateEmailAddress(username).every((rule) => isRuleStatusValid(rule.status));
