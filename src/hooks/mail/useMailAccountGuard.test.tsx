import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import type { PropsWithChildren } from 'react';
import { useMailAccountGuard } from './useMailAccountGuard';
import { createTestStore } from '@/test-utils/createTestStore';
import { MailService } from '@/services/sdk/mail';
import { ErrorService } from '@/services/error';
import { MAIL_NOT_SETUP_CODE } from '@/errors';
import { getMockedUser } from '@/test-utils/fixtures';
import { LocalStorageService } from '@/services/local-storage';
import { MailKeysService } from '@/services/mail-keys';
import { openEncryptionKeystore } from 'internxt-crypto';

vi.mock('internxt-crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('internxt-crypto')>();
  return {
    ...actual,
    openEncryptionKeystore: vi.fn(),
  };
});

const mockedOpenKeystore = vi.mocked(openEncryptionKeystore);

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
};

const mockKeys = {
  address: 'jane@inxt.me',
  publicKey: 'pub',
  encryptionPrivateKey: 'enc',
  recoveryPrivateKey: 'rec',
};

describe('useMailAccountGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedOpenKeystore.mockReset();
    MailKeysService.instance.clear();
  });

  test('When the user has no email yet, then it should stay in loading state', () => {
    const store = createTestStore();

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    expect(result.current.status).toBe('loading');
  });

  test('When the keys are returned, then the status should be ready', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue('mnemonic');
    const decryptedKeys = { publicKey: new Uint8Array([1]), secretKey: new Uint8Array([2]) };
    mockedOpenKeystore.mockResolvedValue(decryptedKeys);
    const user = getMockedUser({ email: 'jane@inxt.me' });
    const store = createTestStore({ user: { isAuthenticated: true, user } });

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(MailKeysService.instance.get(mockKeys.address)).toBe(decryptedKeys);
  });

  test('When the keystore cannot be opened, then the status should be error', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue('mnemonic');
    mockedOpenKeystore.mockRejectedValue(new Error('bad keystore'));
    const user = getMockedUser({ email: 'jane@inxt.me' });
    const store = createTestStore({ user: { isAuthenticated: true, user } });

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  test('When decryption fails once, then it should retry decryption for the same address', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue('mnemonic');
    const decryptedKeys = { publicKey: new Uint8Array([1]), secretKey: new Uint8Array([2]) };
    mockedOpenKeystore.mockRejectedValueOnce(new Error('bad keystore')).mockResolvedValueOnce(decryptedKeys);
    const user = getMockedUser({ email: 'jane@inxt.me' });
    const store = createTestStore({ user: { isAuthenticated: true, user } });

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mockedOpenKeystore).toHaveBeenCalledTimes(2);
    expect(MailKeysService.instance.get(mockKeys.address)).toBe(decryptedKeys);
  });

  test('When the user has not set up a mail account, then the status should be not-setup', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockRejectedValue(new Error('Forbidden'));
    vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
      message: 'Mail account has not been set up',
      status: 403,
      code: MAIL_NOT_SETUP_CODE,
    } as never);
    const user = getMockedUser({ email: 'jane@inxt.me' });
    const store = createTestStore({ user: { isAuthenticated: true, user } });

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('not-setup'));
  });

  test('When fetching keys fails for another reason, then the status should be error', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockRejectedValue(new Error('Network error'));
    vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
      message: 'Network error',
      status: 500,
    } as never);
    const user = getMockedUser({ email: 'jane@inxt.me' });
    const store = createTestStore({ user: { isAuthenticated: true, user } });

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
