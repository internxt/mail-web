import { beforeEach } from 'node:test';
import { describe, expect, test, vi } from 'vitest';
import { initialUserState } from '../..';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { createTestStore } from '@/test-utils/createTestStore';
import { LocalStorageService } from '@/services/local-storage';
import { AuthService } from '@/services/sdk/auth';
import { logoutThunk } from '.';

describe('Logging out the user', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  test('When de user is logged out, then it should be redirected to the auth page (welcome)', async () => {
    const store = createTestStore({
      user: {
        user: { name: 'Test', uuid: '123', email: 'test@example' } as UserSettings,
        isAuthenticated: true,
      },
    });
    const clearCredentialsFromLSSpy = vi.spyOn(LocalStorageService.instance, 'clearCredentials');
    const logoutSpy = vi.spyOn(AuthService.instance, 'logOut').mockResolvedValue();

    await store.dispatch(logoutThunk());

    expect(clearCredentialsFromLSSpy).toHaveBeenCalled();
    expect(logoutSpy).toHaveBeenCalled();
    expect(store.getState().user).toStrictEqual(initialUserState);
    expect(store.getState().user.isAuthenticated).toBeFalsy();
  });
});
