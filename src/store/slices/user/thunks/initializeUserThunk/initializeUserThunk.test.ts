import { describe, expect, vi, beforeEach, test } from 'vitest';

import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { createTestStore } from '@/test-utils/createTestStore';
import { initializeUserThunk, refreshUserThunk, UserUnauthorizedError } from '.';
import { LocalStorageService } from '@/services/local-storage';
import { UserService } from '@/services/user/user.service';
import { AuthService } from '@/services/sdk/auth';
import { auth, TokenStatus } from '@internxt/lib';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { getMockedUser } from '@/test-utils/fixtures';

const testUser = getMockedUser() as UserSettings;

const refreshedUser = getMockedUser({
  emailVerified: true,
  name: 'Fresh',
  uuid: 'uuid-refreshed',
}) as unknown as Awaited<ReturnType<typeof UserService.instance.refreshUser>>['user'];

const authenticatedStore = () =>
  createTestStore({
    user: {
      user: testUser,
      isAuthenticated: true,
    },
  });

describe('Initialize User Thunk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    NavigationService.instance.init(vi.fn());
  });

  test('When the user is authenticated and the refresh succeeds, then it should be initialized', async () => {
    const store = authenticatedStore();
    // A valid token means refreshUserThunk resolves without needing the network.
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');
    vi.spyOn(auth, 'validateTokenAndCheckExpiration').mockReturnValue(TokenStatus.VALID);

    await store.dispatch(initializeUserThunk());

    expect(store.getState().user.isInitialized).toBeTruthy();
  });

  test('When the user is authenticated but the refresh is rejected, then it logs out and does not initialize', async () => {
    const store = authenticatedStore();
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue(null);
    const navigateSpy = vi.spyOn(NavigationService.instance, 'navigate').mockImplementation(() => undefined);
    const logoutSpy = vi.spyOn(AuthService.instance, 'logOut').mockResolvedValue();

    await store.dispatch(initializeUserThunk());

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith({ id: AppView.Welcome });
    expect(store.getState().user.isInitialized).toBeFalsy();
    // logout resets the whole user slice.
    expect(store.getState().user.isAuthenticated).toBeFalsy();
  });

  test('When the user is not authenticated, then it should be redirected to auth (welcome page)', async () => {
    const navigateSpy = vi.spyOn(NavigationService.instance, 'navigate');

    const store = createTestStore({
      user: {
        isAuthenticated: false,
      },
    });

    await store.dispatch(initializeUserThunk());

    expect(navigateSpy).toHaveBeenCalledWith({ id: AppView.Welcome });
    expect(store.getState().user.isInitialized).toBeFalsy();
  });
});

describe('Refresh User Thunk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    NavigationService.instance.init(vi.fn());
  });

  test('When there is no token, then an error indicating so is thrown', async () => {
    const store = authenticatedStore();
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue(null);
    const refreshSpy = vi.spyOn(UserService.instance, 'refreshUser');

    const result = await store.dispatch(refreshUserThunk());

    expect((result as unknown as { error: { message: string } }).error.message).toBe(
      new UserUnauthorizedError().message,
    );
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  test('When there is no user in state, then it rejects as unauthorized', async () => {
    const store = createTestStore({ user: { isAuthenticated: true } });
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');

    const result = await store.dispatch(refreshUserThunk());

    expect(refreshUserThunk.rejected.match(result)).toBe(true);
  });

  test.each([TokenStatus.INVALID, TokenStatus.EXPIRED] as const)(
    'When the token status is %s, then it rejects as unauthorized without refreshing',
    async (status) => {
      const store = authenticatedStore();
      vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');
      vi.spyOn(auth, 'validateTokenAndCheckExpiration').mockReturnValue(status);
      const refreshSpy = vi.spyOn(UserService.instance, 'refreshUser');

      const result = await store.dispatch(refreshUserThunk());

      expect(refreshUserThunk.rejected.match(result)).toBe(true);
      expect(refreshSpy).not.toHaveBeenCalled();
    },
  );

  test('When the token is valid and no forced refresh, then it resolves without refreshing the user', async () => {
    const store = authenticatedStore();
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');
    vi.spyOn(auth, 'validateTokenAndCheckExpiration').mockReturnValue(TokenStatus.VALID);
    const refreshSpy = vi.spyOn(UserService.instance, 'refreshUser');

    const result = await store.dispatch(refreshUserThunk());

    expect(refreshUserThunk.fulfilled.match(result)).toBe(true);
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(store.getState().user.user).toStrictEqual(testUser);
  });

  test('When the token requires a refresh, then it refreshes the user and stores the new token', async () => {
    const store = authenticatedStore();
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');
    vi.spyOn(LocalStorageService.instance, 'set').mockImplementation(() => undefined);
    vi.spyOn(auth, 'validateTokenAndCheckExpiration').mockReturnValue(TokenStatus.REFRESH_REQUIRED);
    const refreshSpy = vi
      .spyOn(UserService.instance, 'refreshUser')
      .mockResolvedValue({ user: refreshedUser, newToken: 'new-token' } as Awaited<
        ReturnType<typeof UserService.instance.refreshUser>
      >);
    vi.spyOn(UserService.instance, 'refreshUserAvatar').mockResolvedValue('avatar-url');

    const result = await store.dispatch(refreshUserThunk());

    expect(refreshUserThunk.fulfilled.match(result)).toBe(true);
    expect(refreshSpy).toHaveBeenCalled();

    const state = store.getState().user;
    expect(state.userToken).toBe('new-token');
    expect(state.user).toMatchObject({
      name: 'Fresh',
      uuid: 'uuid-refreshed',
      avatar: 'avatar-url',
      emailVerified: true,
    });
  });

  test('When forceRefresh is passed with a valid token, then it still refreshes the user', async () => {
    const store = authenticatedStore();
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');
    vi.spyOn(LocalStorageService.instance, 'set').mockImplementation(() => undefined);
    vi.spyOn(auth, 'validateTokenAndCheckExpiration').mockReturnValue(TokenStatus.VALID);
    const refreshSpy = vi
      .spyOn(UserService.instance, 'refreshUser')
      .mockResolvedValue({ user: refreshedUser, newToken: 'new-token' } as Awaited<
        ReturnType<typeof UserService.instance.refreshUser>
      >);
    vi.spyOn(UserService.instance, 'refreshUserAvatar').mockResolvedValue('avatar-url');

    const result = await store.dispatch(refreshUserThunk({ forceRefresh: true }));

    expect(refreshUserThunk.fulfilled.match(result)).toBe(true);
    expect(refreshSpy).toHaveBeenCalled();
  });

  test('When the refresh call fails, then the error is swallowed and the thunk still fulfills', async () => {
    const store = authenticatedStore();
    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('a-token');
    vi.spyOn(auth, 'validateTokenAndCheckExpiration').mockReturnValue(TokenStatus.REFRESH_REQUIRED);
    vi.spyOn(UserService.instance, 'refreshUser').mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await store.dispatch(refreshUserThunk());

    expect(refreshUserThunk.fulfilled.match(result)).toBe(true);
    // The stale user is left in place rather than being wiped.
    expect(store.getState().user.user).toStrictEqual(testUser);
  });
});
