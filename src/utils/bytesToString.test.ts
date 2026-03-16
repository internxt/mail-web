import { describe, expect, test } from 'vitest';
import { bytesToString } from './bytesToString';

describe('Transforming bytes to string', () => {
  test('Should transform bytes to string', () => {
    expect(bytesToString(1024 * 1024 * 1024)).toBe('1.07GB');
  });

  test('Should transform bytes to string with options', () => {
    expect(bytesToString(1024 * 1024 * 1024, { space: true })).toBe('1.07 GB');
    expect(bytesToString(1024 * 1024 * 1024, { nonBreakingSpace: true })).toBe('1.07GB');
  });
});
