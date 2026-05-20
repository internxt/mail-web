import { describe, expect, test } from 'vitest';
import { classifyRecipients, getDomain, isInternxtDomain, uniqueEmailAddresses } from '.';

const internxtDomains = [{ domain: 'inxt.me' }, { domain: 'internxt.com' }];

describe('getDomain', () => {
  test('When the address is valid, then it should return the lowercase domain', () => {
    expect(getDomain('Alice@INXT.me')).toBe('inxt.me');
  });

  test('When the address is malformed, then it should return null', () => {
    expect(getDomain('no-at-sign')).toBeNull();
    expect(getDomain('@nothing')).toBeNull();
    expect(getDomain('nothing@')).toBeNull();
  });

  test('When the local part contains an at-sign in quotes, then it should return the domain after the last separator', () => {
    expect(getDomain('"a@b"@inxt.me')).toBe('inxt.me');
  });
});

describe('isInternxtDomain', () => {
  test('When the domain belongs to Internxt, then it should return true regardless of casing', () => {
    expect(isInternxtDomain('alice@INXT.ME', internxtDomains)).toBe(true);
    expect(isInternxtDomain('bob@internxt.com', internxtDomains)).toBe(true);
  });

  test('When the domain is external, then it should return false', () => {
    expect(isInternxtDomain('eve@gmail.com', internxtDomains)).toBe(false);
  });

  test('When the address is malformed, then it should return false', () => {
    expect(isInternxtDomain('not-an-email', internxtDomains)).toBe(false);
  });
});

describe('uniqueEmailAddresses', () => {
  test('When the same address appears more than once, then it should return a single entry', () => {
    expect(uniqueEmailAddresses(['alice@inxt.me', 'alice@inxt.me'])).toEqual(['alice@inxt.me']);
  });

  test('When addresses differ only by casing, then it should keep one entry', () => {
    expect(uniqueEmailAddresses(['Alice@INXT.me', 'alice@inxt.me'])).toEqual(['alice@inxt.me']);
  });

  test('When multiple different addresses are provided, then it should keep each distinct one', () => {
    expect(uniqueEmailAddresses(['a@inxt.me', 'b@inxt.me', 'a@inxt.me'])).toEqual(['a@inxt.me', 'b@inxt.me']);
  });
});

describe('classifyRecipients', () => {
  test('When every recipient uses an Internxt domain, then all recipients should be classified as internal', () => {
    const result = classifyRecipients(['a@inxt.me', 'b@internxt.com'], internxtDomains);
    expect(result.allInternxt).toBe(true);
    expect(result.internxt).toHaveLength(2);
    expect(result.external).toHaveLength(0);
  });

  test('When any recipient uses an external domain, then recipients should be split into internal and external', () => {
    const result = classifyRecipients(['a@inxt.me', 'b@gmail.com'], internxtDomains);
    expect(result.allInternxt).toBe(false);
    expect(result.internxt).toEqual(['a@inxt.me']);
    expect(result.external).toEqual(['b@gmail.com']);
  });

  test('When the recipient list is empty, then not all recipients should be classified as internal', () => {
    expect(classifyRecipients([], internxtDomains).allInternxt).toBe(false);
  });
});
