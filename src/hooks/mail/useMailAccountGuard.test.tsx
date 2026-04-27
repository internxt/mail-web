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

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
};

const mockKeys = {
  address: 'jane@inxt.me',
  publicKey: 'pub',
  encryptionPrivateKey: 'enc',
  recoveryPrivateKey: 'rec',
  salt: 'salt',
};

describe('useMailAccountGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When the user has no email yet, then it should stay in loading state', () => {
    const store = createTestStore();

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    expect(result.current.status).toBe('loading');
  });

  test('When the keys are returned, then the status should be ready', async () => {
    vi.spyOn(MailService.instance, 'getMailAccountKeys').mockResolvedValue(mockKeys);
    const user = getMockedUser({ email: 'jane@inxt.me' });
    const store = createTestStore({ user: { isAuthenticated: true, user } });

    const { result } = renderHook(() => useMailAccountGuard(), { wrapper: createWrapper(store) });

    await waitFor(() => expect(result.current.status).toBe('ready'));
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
