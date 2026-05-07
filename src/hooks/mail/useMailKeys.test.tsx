import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import type { PropsWithChildren } from 'react';
import { useMailKeys } from './useMailKeys';
import { createTestStore } from '@/test-utils/createTestStore';
import { MailService } from '@/services/sdk/mail';
import { MailKeysService } from '@/services/mail-keys';

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
};

const mockKeys = {
  address: 'jane@inxt.me',
  publicKey: 'pub',
  encryptionPrivateKey: 'enc',
  recoveryPrivateKey: 'rec',
};

describe('useMailKeys', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    MailKeysService.instance.clear();
  });

  test('When the keys query has no data yet, then it should return null', () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockReturnValue(new Promise(() => undefined));
    const store = createTestStore();

    const { result } = renderHook(() => useMailKeys(), { wrapper: createWrapper(store) });

    expect(result.current).toBeNull();
  });

  test('When the address has decrypted keys cached, then it should return them', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    const decryptedKeys = { publicKey: new Uint8Array([1]), secretKey: new Uint8Array([2]) };
    MailKeysService.instance.set(mockKeys.address, decryptedKeys);
    const store = createTestStore();

    const { result } = renderHook(() => useMailKeys(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current).toBe(decryptedKeys));
  });

  test('When the address has no cached keys, then it should return null even after data loads', async () => {
    const fetchSpy = vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    const store = createTestStore();

    const { result, rerender } = renderHook(() => useMailKeys(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    rerender();
    expect(result.current).toBeNull();
  });
});
