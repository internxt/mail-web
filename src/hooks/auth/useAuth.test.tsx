import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import type { PropsWithChildren } from 'react';
import { useAuth } from './useAuth';
import { createTestStore } from '@/test-utils/createTestStore';
import { LocalStorageService } from '@/services/local-storage';
import { PaymentsService } from '@/services/sdk/payments';
import { OauthService } from '@/services/oauth/oauth.service';
import { getMockedLoginCredentials, getMockedSubscription, getMockedTier } from '@/test-utils/fixtures';

const mockedTier = getMockedTier();
const mockedSubscription = getMockedSubscription();
const mockedCredentials = getMockedLoginCredentials();
const mockedUser = mockedCredentials.user;

const translate = vi.fn((key: string) => key);
const onSuccess = vi.fn();

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: PropsWithChildren) => {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('Auth custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    onSuccess.mockClear();
    translate.mockClear();
    vi.spyOn(LocalStorageService.instance, 'saveCredentials');
    vi.spyOn(LocalStorageService.instance, 'setTier');
    vi.spyOn(LocalStorageService.instance, 'setSubscription');
    vi.spyOn(PaymentsService.instance, 'getUserTier').mockResolvedValue(mockedTier);
    vi.spyOn(PaymentsService.instance, 'getUserSubscription').mockResolvedValue(mockedSubscription);
  });

  describe('Handle Login', () => {
    test('When login succeeds, then it should save session and call the success callback', async () => {
      vi.spyOn(OauthService.instance, 'loginWithWeb').mockResolvedValue(mockedCredentials);
      const store = createTestStore();

      const { result } = renderHook(() => useAuth({ onSuccess, translate }), {
        wrapper: createWrapper(store),
      });

      await act(() => result.current.handleWebLogin());

      expect(LocalStorageService.instance.saveCredentials).toHaveBeenCalledWith(
        mockedUser,
        'test-mnemonic',
        'test-token',
      );
      expect(store.getState().user.user).toStrictEqual(mockedUser);
      expect(store.getState().user.userTier).toStrictEqual(mockedTier);
      expect(onSuccess).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Handle Sign Up', () => {
    test('When signup succeeds, then it should save session and use the success callback', async () => {
      vi.spyOn(OauthService.instance, 'signupWithWeb').mockResolvedValue(mockedCredentials);
      const store = createTestStore();

      const { result } = renderHook(() => useAuth({ onSuccess, translate }), {
        wrapper: createWrapper(store),
      });

      await act(() => result.current.handleWebSignup());

      expect(LocalStorageService.instance.saveCredentials).toHaveBeenCalledWith(
        mockedUser,
        'test-mnemonic',
        'test-token',
      );
      expect(onSuccess).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Save user session', () => {
    test('When there is an error getting user tier, then it should still call on success', async () => {
      vi.spyOn(OauthService.instance, 'loginWithWeb').mockResolvedValue(mockedCredentials);
      vi.spyOn(PaymentsService.instance, 'getUserTier').mockRejectedValue(new Error('network error'));
      const store = createTestStore();

      const { result } = renderHook(() => useAuth({ onSuccess, translate }), {
        wrapper: createWrapper(store),
      });

      await act(() => result.current.handleWebLogin());

      expect(store.getState().user.user).toStrictEqual(mockedUser);
      expect(store.getState().user.userTier).toBeUndefined();
      expect(onSuccess).toHaveBeenCalledWith('test-token');
    });
  });
});
