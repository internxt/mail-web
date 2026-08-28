import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import type { PropsWithChildren } from 'react';
import { createEncryptionAndRecoveryKeystores } from 'internxt-crypto';
import { useSetupMailAccount } from './useSetupMailAccount';
import { createTestStore } from '@/test-utils/createTestStore';
import { CryptoService } from '@/services/crypto';
import { ErrorService } from '@/services/error';
import { LocalStorageService } from '@/services/local-storage';
import { NavigationService } from '@/services/navigation';
import { MailService } from '@/services/sdk/mail';
import { AppView } from '@/routes/paths';
import { ToastType } from '@/services/notifications';

vi.mock('internxt-crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('internxt-crypto')>();
  return {
    ...actual,
    createEncryptionAndRecoveryKeystores: vi.fn(),
  };
});

vi.mock('@/i18n', () => ({
  useTranslationContext: () => ({ translate: (key: string) => key }),
}));

const mockedCreateKeystores = vi.mocked(createEncryptionAndRecoveryKeystores);

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
};

const newAddress = { address: 'jane', domain: 'inxt.me', hashedPassword: 'hashed-password' };

const renderSetupHook = () => {
  const store = createTestStore({ user: { isAuthenticated: true } });
  return renderHook(() => useSetupMailAccount({ userFullName: 'Jane Doe' }), { wrapper: createWrapper(store) });
};

describe('useSetupMailAccount', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedCreateKeystores.mockReset();
    mockedCreateKeystores.mockResolvedValue({
      encryptionKeystore: { publicKey: 'pub', privateKeyEncrypted: 'enc' },
      recoveryKeystore: { privateKeyEncrypted: 'rec' },
    } as never);
    vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue('mnemonic');
    vi.spyOn(CryptoService.instance, 'encryptTextWithKey').mockReturnValue('encrypted-password');
  });

  test('When provisioning succeeds, then it should take the user to the inbox', async () => {
    vi.spyOn(MailService.instance, 'setupMailAccount').mockResolvedValue({ address: 'jane@inxt.me' });
    const replaceSpy = vi.spyOn(NavigationService.instance, 'replace').mockImplementation(() => undefined as never);

    const { result } = renderSetupHook();
    await act(() => result.current.setupMailAccount(newAddress));

    expect(MailService.instance.setupMailAccount).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'jane', domain: 'inxt.me', displayName: 'Jane Doe' }),
    );
    expect(replaceSpy).toHaveBeenCalledWith({ id: AppView.Inbox });
  });

  test('When provisioning is rejected because of the plan, then it should say so and take the user to the upgrade screen', async () => {
    vi.spyOn(MailService.instance, 'setupMailAccount').mockRejectedValue(new Error('Forbidden'));
    vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
      message: 'Mail access is not available for your current plan',
      status: 403,
    } as never);
    const notifySpy = vi.spyOn(ErrorService.instance, 'notifyUser').mockImplementation(() => undefined);
    const replaceSpy = vi.spyOn(NavigationService.instance, 'replace').mockImplementation(() => undefined as never);

    const { result } = renderSetupHook();
    await act(() => result.current.setupMailAccount(newAddress));

    expect(notifySpy).toHaveBeenCalledWith('errors.identitySetup.planNotSupported', ToastType.Warning);
    expect(replaceSpy).toHaveBeenCalledWith({
      id: AppView.Welcome,
      options: { state: { planAlreadyNotified: true } },
    });
  });

  test('When provisioning fails for another reason, then it should show the generic error and stay in place', async () => {
    vi.spyOn(MailService.instance, 'setupMailAccount').mockRejectedValue(new Error('Network error'));
    vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
      message: 'Network error',
      status: 500,
    } as never);
    const notifySpy = vi.spyOn(ErrorService.instance, 'notifyUser').mockImplementation(() => undefined);
    const replaceSpy = vi.spyOn(NavigationService.instance, 'replace').mockImplementation(() => undefined as never);

    const { result } = renderSetupHook();
    await act(() => result.current.setupMailAccount(newAddress));

    expect(notifySpy).toHaveBeenCalledWith('errors.identitySetup.setupFailed');
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  test('When the mnemonic is missing, then it should not attempt to provision the account', async () => {
    vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue(null);
    const setupSpy = vi.spyOn(MailService.instance, 'setupMailAccount');
    const notifySpy = vi.spyOn(ErrorService.instance, 'notifyUser').mockImplementation(() => undefined);

    const { result } = renderSetupHook();
    await act(() => result.current.setupMailAccount(newAddress));

    expect(setupSpy).not.toHaveBeenCalled();
    expect(notifySpy).toHaveBeenCalledWith('errors.identitySetup.setupFailed');
  });

  test('When provisioning is in flight, then it should report progress and clear it once settled', async () => {
    let resolveSetup: (value: { address: string }) => void = () => undefined;
    vi.spyOn(MailService.instance, 'setupMailAccount').mockReturnValue(
      new Promise((resolve) => {
        resolveSetup = resolve;
      }),
    );
    vi.spyOn(NavigationService.instance, 'replace').mockImplementation(() => undefined as never);

    const { result } = renderSetupHook();
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.setupMailAccount(newAddress);
    });

    await waitFor(() => expect(result.current.isConfirmingChange).toBe(true));

    await act(async () => {
      resolveSetup({ address: 'jane@inxt.me' });
      await pending;
    });

    expect(result.current.isConfirmingChange).toBe(false);
  });
});
