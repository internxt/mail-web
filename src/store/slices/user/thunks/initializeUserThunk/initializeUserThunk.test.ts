import { describe, it, expect, vi, beforeEach, test } from 'vitest';

import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { createTestStore } from '@/test-utils/createTestStore';
import { initializeUserThunk } from '.';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';

describe('Initialize User Thunk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    NavigationService.instance.init(vi.fn());
  });

  test('When the user is authenticated, then it should be initialized', async () => {
    const store = createTestStore({
      user: {
        user: { name: 'Test', uuid: '123', email: 'test@example' } as UserSettings,
        isAuthenticated: true,
      },
    });

    await store.dispatch(initializeUserThunk());

    expect(store.getState().user.isInitialized).toBeTruthy();
  });

  it('When the user is not authenticated, then it should be redirected to auth (welcome page)', async () => {
    const navigateSpy = vi.spyOn(NavigationService.instance, 'navigate');

    const store = createTestStore({
      user: {
        isAuthenticated: false,
      },
    });

    await store.dispatch(initializeUserThunk());

    expect(navigateSpy).toHaveBeenCalledWith(AppView.welcome);
    expect(store.getState().user.isInitialized).toBeFalsy();
  });
});
