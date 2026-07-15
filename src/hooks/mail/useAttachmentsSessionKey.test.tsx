import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import type { HybridKeyPair } from 'internxt-crypto';
import { useAttachmentsSessionKey } from './useAttachmentsSessionKey';
import { MailEncryptionService } from '@/services/mail-encryption';
import { MailKeysService } from '@/services/mail-keys';

const KEY = new Uint8Array([1, 2, 3, 4]);
const KEYPAIR = { secretKey: new Uint8Array(32), publicKey: new Uint8Array(32) } as unknown as HybridKeyPair;
const ENVELOPE = {
  version: 'v3',
  encryptedText: 'ct',
  encryptedPreview: 'cp',
  encryptedAttachmentsSessionKey: 'ck',
  wrappedKeys: [],
} as unknown as EncryptionBlock;

const setKeys = (keys: HybridKeyPair | null) => {
  const spy = vi.spyOn(MailKeysService.instance, 'getCurrentKeys');
  spy.mockReturnValue(keys);
  vi.spyOn(MailKeysService.instance, 'getCurrentAddress').mockReturnValue(keys ? 'me@inxt.me' : null);
  return spy;
};

beforeEach(() => {
  setKeys(KEYPAIR);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAttachmentsSessionKey', () => {
  test('When mailId is null, then the hook returns null and skips decryption', async () => {
    const decryptSpy = vi.spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey').mockResolvedValue(KEY);

    const { result } = renderHook(() => useAttachmentsSessionKey(null, ENVELOPE));

    expect(result.current).toBeNull();
    expect(decryptSpy).not.toHaveBeenCalled();
  });

  test('When envelope is null, then the hook returns null and skips decryption', async () => {
    const decryptSpy = vi.spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey').mockResolvedValue(KEY);

    const { result } = renderHook(() => useAttachmentsSessionKey('mail-1', null));

    expect(result.current).toBeNull();
    expect(decryptSpy).not.toHaveBeenCalled();
  });

  test('When the keypair is not yet available, then decryption is deferred until it loads', async () => {
    setKeys(null);
    const decryptSpy = vi.spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey').mockResolvedValue(KEY);

    const { result, rerender } = renderHook(() => useAttachmentsSessionKey('mail-1', ENVELOPE));

    expect(result.current).toBeNull();
    expect(decryptSpy).not.toHaveBeenCalled();

    setKeys(KEYPAIR);
    rerender();

    await waitFor(() => expect(result.current).toBe(KEY));
    expect(decryptSpy).toHaveBeenCalledTimes(1);
  });

  test('When inputs are ready, then the decrypted session key is returned', async () => {
    vi.spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey').mockResolvedValue(KEY);

    const { result } = renderHook(() => useAttachmentsSessionKey('mail-1', ENVELOPE));

    await waitFor(() => expect(result.current).toBe(KEY));
  });

  test('When the hook re-renders for the same mailId, then the key is decrypted only once', async () => {
    const decryptSpy = vi.spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey').mockResolvedValue(KEY);

    const { result, rerender } = renderHook(() => useAttachmentsSessionKey('mail-1', ENVELOPE));

    await waitFor(() => expect(result.current).toBe(KEY));
    rerender();
    rerender();

    expect(decryptSpy).toHaveBeenCalledTimes(1);
  });

  test('When the mailId changes, then the new envelope is decrypted independently', async () => {
    const otherKey = new Uint8Array([9, 9, 9]);
    const decryptSpy = vi
      .spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey')
      .mockResolvedValueOnce(KEY)
      .mockResolvedValueOnce(otherKey);

    let mailId = 'mail-1';
    const { result, rerender } = renderHook(() => useAttachmentsSessionKey(mailId, ENVELOPE));

    await waitFor(() => expect(result.current).toBe(KEY));

    act(() => {
      mailId = 'mail-2';
    });
    rerender();

    await waitFor(() => expect(result.current).toBe(otherKey));
    expect(decryptSpy).toHaveBeenCalledTimes(2);
  });

  test('When decryption fails, then the hook stays at null and logs the error once', async () => {
    const error = new Error('decrypt failed');
    vi.spyOn(MailEncryptionService.instance, 'decryptAttachmentsSessionKey').mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, rerender } = renderHook(() => useAttachmentsSessionKey('mail-1', ENVELOPE));

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt attachments session key', error));
    expect(result.current).toBeNull();

    consoleSpy.mockClear();
    rerender();
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
