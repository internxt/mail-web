import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initialUserState } from '../..';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { createTestStore } from '@/test-utils/createTestStore';
import { AuthService } from '@/services/sdk/auth';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { logoutThunk } from '.';

describe('Logging out the user', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When the user logs out successfully, then state is reset and navigates to welcome', async () => {
    const store = createTestStore({
      user: {
        user: { name: 'Test', uuid: '123', email: 'test@example' } as UserSettings,
        isAuthenticated: true,
      },
    });
    const logoutSpy = vi.spyOn(AuthService.instance, 'logOut').mockResolvedValue();
    const navigateSpy = vi.spyOn(NavigationService.instance, 'navigate').mockImplementation(() => undefined);

    await store.dispatch(logoutThunk());

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith({ id: AppView.Welcome });
    expect(store.getState().user).toStrictEqual(initialUserState);
    expect(store.getState().user.isAuthenticated).toBeFalsy();
  });

  test('When logging out fails, then state is still reset and navigates to welcome', async () => {
    const store = createTestStore({
      user: {
        user: { name: 'Test', uuid: '123', email: 'test@example' } as UserSettings,
        isAuthenticated: true,
      },
    });
    vi.spyOn(AuthService.instance, 'logOut').mockRejectedValue(new Error('Network error'));
    const navigateSpy = vi.spyOn(NavigationService.instance, 'navigate').mockImplementation(() => undefined);

    await store.dispatch(logoutThunk());

    expect(navigateSpy).toHaveBeenCalledWith({ id: AppView.Welcome });
    expect(store.getState().user).toStrictEqual(initialUserState);
    expect(store.getState().user.isAuthenticated).toBeFalsy();
  });
});
