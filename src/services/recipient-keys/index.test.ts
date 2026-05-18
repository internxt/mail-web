import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RecipientKeysService } from '.';

describe('RecipientKeysService', () => {
  beforeEach(() => {
    RecipientKeysService.instance.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('stores and retrieves a public key', () => {
    RecipientKeysService.instance.set('alice@inxt.me', 'pk');
    expect(RecipientKeysService.instance.get('alice@inxt.me')?.publicKey).toBe('pk');
  });

  test('matches addresses case-insensitively', () => {
    RecipientKeysService.instance.set('Alice@INXT.me', 'pk');
    expect(RecipientKeysService.instance.has('alice@inxt.me')).toBe(true);
  });

  test('returns null after the TTL has passed', () => {
    RecipientKeysService.instance.set('alice@inxt.me', 'pk');
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(RecipientKeysService.instance.get('alice@inxt.me')).toBeNull();
  });

  test('clear() empties the cache', () => {
    RecipientKeysService.instance.set('a@inxt.me', 'pk1');
    RecipientKeysService.instance.set('b@inxt.me', 'pk2');
    RecipientKeysService.instance.clear();
    expect(RecipientKeysService.instance.get('a@inxt.me')).toBeNull();
    expect(RecipientKeysService.instance.get('b@inxt.me')).toBeNull();
  });
});
