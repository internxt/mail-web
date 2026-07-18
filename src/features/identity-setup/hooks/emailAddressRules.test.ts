import { describe, expect, test } from 'vitest';
import {
  isEmailAddressFormatValid,
  isEmailAddressValid,
  isRuleStatusValid,
  validateEmailAddress,
  type AddressAvailability,
  type EmailAddressRuleId,
  type EmailAddressRuleStatus,
} from './emailAddressRules';

const ruleStatus = (
  username: string,
  id: EmailAddressRuleId,
  availability?: AddressAvailability,
): EmailAddressRuleStatus => validateEmailAddress(username, availability).find((rule) => rule.id === id)!.status;

describe('emailAddressRules', () => {
  describe('length rule', () => {
    test('When username has fewer than 3 characters, then it is invalid', () => {
      const username = 'ab';

      const status = ruleStatus(username, 'length');

      expect(status).toBe('invalid');
    });

    test('When username has exactly 3 characters, then it is valid', () => {
      const username = 'abc';

      const status = ruleStatus(username, 'length');

      expect(status).toBe('valid');
    });

    test('When username has exactly 30 characters, then it is valid', () => {
      const username = 'a'.repeat(30);

      const status = ruleStatus(username, 'length');

      expect(status).toBe('valid');
    });

    test('When username has more than 30 characters, then it is invalid', () => {
      const username = 'a'.repeat(31);

      const status = ruleStatus(username, 'length');

      expect(status).toBe('invalid');
    });

    test('When username is empty, then it is idle', () => {
      const username = '';

      const status = ruleStatus(username, 'length');

      expect(status).toBe('idle');
    });
  });

  describe('charset rule', () => {
    test('When username only has lowercase letters, numbers, periods, hyphens and underscores, then it is valid', () => {
      const username = 'jane.doe-99_x';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('valid');
    });

    test('When username contains an uppercase letter, then it is invalid', () => {
      const username = 'Jane';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('invalid');
    });

    test('When username contains a space, then it is invalid', () => {
      const username = 'jane doe';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('invalid');
    });

    test('When username contains an unsupported symbol, then it is invalid', () => {
      const username = 'jane@doe';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('invalid');
    });

    test('When username has two consecutive periods, then it is invalid', () => {
      const username = 'jane..doe';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('invalid');
    });

    test('When username has two consecutive underscores, then it is invalid', () => {
      const username = 'jane__doe';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('invalid');
    });

    test('When username mixes two different consecutive special characters, then it is invalid', () => {
      const username = 'jane.-doe';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('invalid');
    });

    test('When username has single, non-adjacent special characters, then it is valid', () => {
      const username = 'jane.doe-99_x';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('valid');
    });

    test('When username is empty, then it is idle', () => {
      const username = '';

      const status = ruleStatus(username, 'charset');

      expect(status).toBe('idle');
    });
  });

  describe('edges rule', () => {
    test('When username starts with a period, then it is invalid', () => {
      const username = '.jane';

      const status = ruleStatus(username, 'edges');

      expect(status).toBe('invalid');
    });

    test('When username ends with a hyphen, then it is invalid', () => {
      const username = 'jane-';

      const status = ruleStatus(username, 'edges');

      expect(status).toBe('invalid');
    });

    test('When username starts with an underscore, then it is invalid', () => {
      const username = '_jane';

      const status = ruleStatus(username, 'edges');

      expect(status).toBe('invalid');
    });

    test('When username starts and ends with alphanumeric characters, then it is valid', () => {
      const username = 'jane.doe';

      const status = ruleStatus(username, 'edges');

      expect(status).toBe('valid');
    });

    test('When username is empty, then it is idle', () => {
      const username = '';

      const status = ruleStatus(username, 'edges');

      expect(status).toBe('idle');
    });
  });

  describe('available rule', () => {
    test.each(['admin', 'support', 'postmaster', 'noreply'])(
      'When username is the reserved name "%s", then it is invalid',
      (reservedName) => {
        const status = ruleStatus(reservedName, 'available');

        expect(status).toBe('invalid');
      },
    );

    test('When username is well formatted but availability has not been checked yet, then it is idle', () => {
      const username = 'jane.doe';

      const status = ruleStatus(username, 'available');

      expect(status).toBe('idle');
    });

    test('When the availability check is in flight, then it is idle', () => {
      const status = ruleStatus('jane.doe', 'available', { status: 'checking' });

      expect(status).toBe('idle');
    });

    test('When the backend reports the address as available, then it is valid', () => {
      const status = ruleStatus('jane.doe', 'available', { status: 'available' });

      expect(status).toBe('valid');
    });

    test('When the backend reports the address as taken with a suggestion, then it is invalid and carries the suggestion', () => {
      const rule = validateEmailAddress('jane.doe', { status: 'taken', suggestion: 'jane.doe1@inxt.me' }).find(
        (r) => r.id === 'available',
      )!;

      expect(rule.status).toBe('invalid');
      expect(rule.labelKey).toBe('identitySetup.updateEmail.rules.taken');
      expect(rule.labelParams).toEqual({ suggestion: 'jane.doe1@inxt.me' });
    });

    test('When the backend reports the address as taken without a suggestion, then it is invalid with the fallback label', () => {
      const rule = validateEmailAddress('jane.doe', { status: 'taken', suggestion: null }).find(
        (r) => r.id === 'available',
      )!;

      expect(rule.status).toBe('invalid');
      expect(rule.labelKey).toBe('identitySetup.updateEmail.rules.takenNoSuggestion');
      expect(rule.labelParams).toBeUndefined();
    });

    test('When username is empty, then it is idle', () => {
      const username = '';

      const status = ruleStatus(username, 'available');

      expect(status).toBe('idle');
    });

    test('When a formatting rule fails, then it stays idle even if the backend reported availability', () => {
      const status = ruleStatus('Jane', 'available', { status: 'available' });

      expect(status).toBe('idle');
    });
  });

  describe('isEmailAddressFormatValid', () => {
    test('When username satisfies every format rule, then it is valid', () => {
      expect(isEmailAddressFormatValid('jane.doe-99_x')).toBe(true);
    });

    test('When username is a reserved name, then it is invalid', () => {
      expect(isEmailAddressFormatValid('admin')).toBe(false);
    });

    test('When username breaks a format rule, then it is invalid', () => {
      expect(isEmailAddressFormatValid('.jane')).toBe(false);
    });
  });

  describe('isRuleStatusValid', () => {
    test('When status is valid, then it returns true', () => {
      const status: EmailAddressRuleStatus = 'valid';

      const result = isRuleStatusValid(status);

      expect(result).toBe(true);
    });

    test('When status is invalid, then it returns false', () => {
      const status: EmailAddressRuleStatus = 'invalid';

      const result = isRuleStatusValid(status);

      expect(result).toBe(false);
    });

    test('When status is idle, then it returns false', () => {
      const status: EmailAddressRuleStatus = 'idle';

      const result = isRuleStatusValid(status);

      expect(result).toBe(false);
    });
  });

  describe('isEmailAddressValid', () => {
    test('When username satisfies every rule and the backend confirmed availability, then it is valid', () => {
      const username = 'jane.doe-99_x';

      const result = isEmailAddressValid(username, { status: 'available' });

      expect(result).toBe(true);
    });

    test('When availability has not been confirmed yet, then it is invalid', () => {
      const username = 'jane.doe-99_x';

      const result = isEmailAddressValid(username);

      expect(result).toBe(false);
    });

    test('When username fails at least one rule, then it is invalid', () => {
      const username = 'admin';

      const result = isEmailAddressValid(username, { status: 'available' });

      expect(result).toBe(false);
    });

    test('When username is empty, then it is invalid', () => {
      const username = '';

      const result = isEmailAddressValid(username);

      expect(result).toBe(false);
    });
  });
});
