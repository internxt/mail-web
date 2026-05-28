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

  test('When a public key is set for an address, then it can be retrieved by that address', () => {
    RecipientKeysService.instance.set('alice@inxt.me', 'pk');
    expect(RecipientKeysService.instance.get('alice@inxt.me')?.publicKey).toBe('pk');
  });

  test('When the lookup address differs only in case from the stored one, then the key is still found', () => {
    RecipientKeysService.instance.set('Alice@INXT.me', 'pk');
    expect(RecipientKeysService.instance.has('alice@inxt.me')).toBe(true);
  });

  test('When the TTL has elapsed since the key was stored, then get returns null', () => {
    RecipientKeysService.instance.set('alice@inxt.me', 'pk');
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(RecipientKeysService.instance.get('alice@inxt.me')).toBeNull();
  });

  test('When clear is called, then all previously cached keys are removed', () => {
    RecipientKeysService.instance.set('a@inxt.me', 'pk1');
    RecipientKeysService.instance.set('b@inxt.me', 'pk2');
    RecipientKeysService.instance.clear();
    expect(RecipientKeysService.instance.get('a@inxt.me')).toBeNull();
    expect(RecipientKeysService.instance.get('b@inxt.me')).toBeNull();
  });
});
