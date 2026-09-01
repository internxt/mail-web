import { describe, test, expect } from 'vitest';
import { parseRecipients } from './parse-recipients';

describe('Parsing a recipient list', () => {
  test('When a comma separated list is parsed, then every address is returned', () => {
    const result = parseRecipients('alice@example.com, bob@example.com,carol@example.com');

    expect(result).toEqual({ emails: ['alice@example.com', 'bob@example.com', 'carol@example.com'], invalid: [] });
  });

  test('When the list is separated by semicolons or line breaks, then every address is returned', () => {
    const result = parseRecipients('alice@example.com; bob@example.com\ncarol@example.com');

    expect(result.emails).toEqual(['alice@example.com', 'bob@example.com', 'carol@example.com']);
  });

  test('When the addresses are only separated by spaces, then every address is returned', () => {
    const result = parseRecipients('alice@example.com bob@example.com');

    expect(result.emails).toEqual(['alice@example.com', 'bob@example.com']);
  });

  test('When the list carries display names, then only the addresses are returned', () => {
    const result = parseRecipients('Alice Smith <alice@example.com>, "Doe, John" <john@example.com>');

    expect(result).toEqual({ emails: ['alice@example.com', 'john@example.com'], invalid: [] });
  });

  test('When the same address appears more than once, then it is returned a single time', () => {
    const result = parseRecipients('alice@example.com, ALICE@example.com, bob@example.com');

    expect(result.emails).toEqual(['alice@example.com', 'bob@example.com']);
  });

  test('When some entries are not valid addresses, then the valid ones are kept and the rest reported', () => {
    const result = parseRecipients('alice@example.com, not-an-email, bob@example.com');

    expect(result).toEqual({ emails: ['alice@example.com', 'bob@example.com'], invalid: ['not-an-email'] });
  });

  test('When the list has trailing separators or blank entries, then they are ignored', () => {
    const result = parseRecipients('  alice@example.com ,, \n bob@example.com,  ');

    expect(result).toEqual({ emails: ['alice@example.com', 'bob@example.com'], invalid: [] });
  });

  test('When a single address is parsed, then it is returned on its own', () => {
    const result = parseRecipients('alice@example.com');

    expect(result).toEqual({ emails: ['alice@example.com'], invalid: [] });
  });

  test('When there is nothing to parse, then nothing is returned', () => {
    const result = parseRecipients('   ');

    expect(result).toEqual({ emails: [], invalid: [] });
  });
});
