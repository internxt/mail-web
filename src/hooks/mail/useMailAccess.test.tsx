import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import type { PropsWithChildren } from 'react';
import { Service } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { useMailAccess } from './useMailAccess';
import { createTestStore } from '@/test-utils/createTestStore';
import { getMockedTier } from '@/test-utils/fixtures';
import { MailService } from '@/services/sdk/mail';
import { PaymentsService } from '@/services/sdk/payments';
import { ErrorService } from '@/services/error';
import { MAIL_NOT_SETUP_CODE } from '@/errors';
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

const createAuthenticatedStore = () => createTestStore({ user: { isAuthenticated: true } });

const mockKeys = {
  address: 'jane@inxt.me',
  publicKey: 'pub',
  encryptionPrivateKey: 'enc',
  recoveryPrivateKey: 'rec',
};

const tierWithMail = (enabled: boolean) => {
  const tier = getMockedTier();
  return {
    ...tier,
    featuresPerService: {
      ...tier.featuresPerService,
      [Service.Mail]: { ...tier.featuresPerService[Service.Mail], enabled },
    },
  };
};

/** Makes the account keys request fail the way the backend rejects a user without a mail account. */
const mockAccountNotSetUp = () => {
  vi.spyOn(MailService.instance, 'getMailAccountKeys').mockRejectedValue(new Error('Forbidden'));
  vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
    message: 'Mail account has not been set up',
    status: 403,
    code: MAIL_NOT_SETUP_CODE,
  } as never);
};

/** Makes the account keys request succeed and the keystore open, so the account is usable. */
const mockAccountReady = () => {
  vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
  vi.spyOn(LocalStorageService.instance, 'getMnemonic').mockReturnValue('mnemonic');
  mockedOpenKeystore.mockResolvedValue({ publicKey: new Uint8Array([1]), secretKey: new Uint8Array([2]) });
};

describe('useMailAccess', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedOpenKeystore.mockReset();
    MailKeysService.instance.clear();
  });

  test('When the user is not authenticated, then it should stay in loading state and request nothing', () => {
    const getKeysSpy = vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    const getTierSpy = vi.spyOn(PaymentsService.instance, 'getUserTier').mockResolvedValue(tierWithMail(true));
    const store = createTestStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    expect(result.current.status).toBe('loading');
    expect(getKeysSpy).not.toHaveBeenCalled();
    expect(getTierSpy).not.toHaveBeenCalled();
  });

  test('When the account is not set up and the plan excludes mail, then the status should be plan-required', async () => {
    mockAccountNotSetUp();
    vi.spyOn(PaymentsService.instance, 'getUserTier').mockResolvedValue(tierWithMail(false));
    const store = createAuthenticatedStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('plan-required'));
  });

  test('When the account is not set up and the plan includes mail, then the status should be needs-setup', async () => {
    mockAccountNotSetUp();
    vi.spyOn(PaymentsService.instance, 'getUserTier').mockResolvedValue(tierWithMail(true));
    const store = createAuthenticatedStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('needs-setup'));
  });

  test('When the tier cannot be fetched, then setup should not be blocked', async () => {
    mockAccountNotSetUp();
    vi.spyOn(PaymentsService.instance, 'getUserTier').mockRejectedValue(new Error('payments is down'));
    const store = createAuthenticatedStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('needs-setup'));
  });

  test('When the tier is still being fetched, then it should stay in loading state', async () => {
    mockAccountNotSetUp();
    vi.spyOn(PaymentsService.instance, 'getUserTier').mockReturnValue(new Promise(() => undefined));
    const store = createAuthenticatedStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(PaymentsService.instance.getUserTier).toHaveBeenCalled());
    expect(result.current.status).toBe('loading');
  });

  test('When the account exists but the plan no longer includes mail, then access should be kept during the grace period', async () => {
    mockAccountReady();
    const getTierSpy = vi.spyOn(PaymentsService.instance, 'getUserTier').mockResolvedValue(tierWithMail(false));
    const store = createAuthenticatedStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(getTierSpy).not.toHaveBeenCalled();
  });

  test('When the account keys cannot be read, then the status should be error', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockRejectedValue(new Error('Network error'));
    vi.spyOn(ErrorService.instance, 'castError').mockReturnValue({
      message: 'Network error',
      status: 500,
    } as never);
    const store = createAuthenticatedStore();

    const { result } = renderHook(() => useMailAccess(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
