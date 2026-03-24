import { describe, expect, test } from 'vitest';
import { isValidEmail } from '.';

describe('Validating the email', () => {
  test('When validating correct emails, then it should return true', () => {
    expect(isValidEmail('user@intx.me')).toBe(true);
    expect(isValidEmail('john.doe@inxt.eu')).toBe(true);
    expect(isValidEmail('test+tag@encrypt.eu')).toBe(true);
  });

  test('when validating incorrect emails, then it should return false', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@missing-user.com')).toBe(false);
    expect(isValidEmail('missing-domain@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});
