import { describe, expect, test } from 'vitest';
import { bytesToString } from '.';

const ONE_GB = 1024 * 1024 * 1024;
describe('Transforming bytes to string', () => {
  test('Should transform bytes to string', () => {
    expect(bytesToString({ size: ONE_GB })).toBe('1GB');
  });

  test('Should transform bytes to string with options', () => {
    expect(bytesToString({ size: ONE_GB, removeSpace: false })).toBe('1 GB');
  });
});
