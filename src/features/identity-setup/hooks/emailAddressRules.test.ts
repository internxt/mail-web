import { describe, expect, test } from 'vitest';
import {
  isEmailAddressValid,
  isRuleStatusValid,
  validateEmailAddress,
  type EmailAddressRuleId,
  type EmailAddressRuleStatus,
} from './emailAddressRules';

const ruleStatus = (username: string, id: EmailAddressRuleId): EmailAddressRuleStatus =>
  validateEmailAddress(username).find((rule) => rule.id === id)!.status;

describe('emailAddressRules', () => {
  describe('length rule', () => {
    test('When username has fewer than 3 characters, then it is invalid', () => {
      expect(ruleStatus('ab', 'length')).toBe('invalid');
    });

    test('When username has exactly 3 characters, then it is valid', () => {
      expect(ruleStatus('abc', 'length')).toBe('valid');
    });

    test('When username has exactly 30 characters, then it is valid', () => {
      expect(ruleStatus('a'.repeat(30), 'length')).toBe('valid');
    });

    test('When username has more than 30 characters, then it is invalid', () => {
      expect(ruleStatus('a'.repeat(31), 'length')).toBe('invalid');
    });

    test('When username is empty, then it is idle', () => {
      expect(ruleStatus('', 'length')).toBe('idle');
    });
  });

  describe('charset rule', () => {
    test('When username only has lowercase letters, numbers, periods, hyphens and underscores, then it is valid', () => {
      expect(ruleStatus('jane.doe-99_x', 'charset')).toBe('valid');
    });

    test('When username contains an uppercase letter, then it is invalid', () => {
      expect(ruleStatus('Jane', 'charset')).toBe('invalid');
    });

    test('When username contains a space, then it is invalid', () => {
      expect(ruleStatus('jane doe', 'charset')).toBe('invalid');
    });

    test('When username contains an unsupported symbol, then it is invalid', () => {
      expect(ruleStatus('jane@doe', 'charset')).toBe('invalid');
    });

    test('When username has two consecutive periods, then it is invalid', () => {
      expect(ruleStatus('jane..doe', 'charset')).toBe('invalid');
    });

    test('When username has two consecutive underscores, then it is invalid', () => {
      expect(ruleStatus('jane__doe', 'charset')).toBe('invalid');
    });

    test('When username mixes two different consecutive special characters, then it is invalid', () => {
      expect(ruleStatus('jane.-doe', 'charset')).toBe('invalid');
    });

    test('When username has single, non-adjacent special characters, then it is valid', () => {
      expect(ruleStatus('jane.doe-99_x', 'charset')).toBe('valid');
    });

    test('When username is empty, then it is idle', () => {
      expect(ruleStatus('', 'charset')).toBe('idle');
    });
  });

  describe('edges rule', () => {
    test('When username starts with a period, then it is invalid', () => {
      expect(ruleStatus('.jane', 'edges')).toBe('invalid');
    });

    test('When username ends with a hyphen, then it is invalid', () => {
      expect(ruleStatus('jane-', 'edges')).toBe('invalid');
    });

    test('When username starts with an underscore, then it is invalid', () => {
      expect(ruleStatus('_jane', 'edges')).toBe('invalid');
    });

    test('When username starts and ends with alphanumeric characters, then it is valid', () => {
      expect(ruleStatus('jane.doe', 'edges')).toBe('valid');
    });

    test('When username is empty, then it is idle', () => {
      expect(ruleStatus('', 'edges')).toBe('idle');
    });
  });

  describe('available rule', () => {
    test.each(['admin', 'support', 'postmaster', 'noreply'])(
      'When username is the reserved name "%s", then it is invalid',
      (reservedName) => {
        expect(ruleStatus(reservedName, 'available')).toBe('invalid');
      },
    );

    test('When username is not a reserved name, then it is valid', () => {
      expect(ruleStatus('jane.doe', 'available')).toBe('valid');
    });

    test('When username is empty, then it is idle', () => {
      expect(ruleStatus('', 'available')).toBe('idle');
    });

    test('When a formatting rule fails, then it stays idle instead of being checked', () => {
      expect(ruleStatus('Jane', 'available')).toBe('idle');
    });
  });

  describe('isRuleStatusValid', () => {
    test('When status is valid, then it returns true', () => {
      expect(isRuleStatusValid('valid')).toBe(true);
    });

    test('When status is invalid, then it returns false', () => {
      expect(isRuleStatusValid('invalid')).toBe(false);
    });

    test('When status is idle, then it returns false', () => {
      expect(isRuleStatusValid('idle')).toBe(false);
    });
  });

  describe('isEmailAddressValid', () => {
    test('When username satisfies every rule, then it is valid', () => {
      expect(isEmailAddressValid('jane.doe-99_x')).toBe(true);
    });

    test('When username fails at least one rule, then it is invalid', () => {
      expect(isEmailAddressValid('admin')).toBe(false);
    });

    test('When username is empty, then it is invalid', () => {
      expect(isEmailAddressValid('')).toBe(false);
    });
  });
});
