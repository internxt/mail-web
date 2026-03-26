import { describe, expect, vi, beforeEach, test } from 'vitest';

import { NavigationService } from '@/services/navigation';
import { createTestStore } from '@/test-utils/createTestStore';

import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { refreshAvatarThunk } from '.';
import { UserService } from '@/services/user/user.service';
import { getMockedUser } from '@/test-utils/fixtures';

describe('Refresh User Avatar Thunk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    NavigationService.instance.init(vi.fn());
  });

  test('When refreshing the avatar, then it should be fetched correctly', async () => {
    const mockedAvatar = getMockedUser().avatar;
    vi.spyOn(UserService.instance, 'refreshUserAvatar').mockResolvedValue(mockedAvatar);
    const store = createTestStore({
      user: {
        user: { name: 'Test', uuid: '123', email: 'test@example' } as UserSettings,
      },
    });

    await store.dispatch(refreshAvatarThunk());

    expect(store.getState().user.user?.avatar).toBe(mockedAvatar);
  });

  test('When there is no user to update the avatar, then the user state should not be modified', async () => {
    vi.spyOn(UserService.instance, 'refreshUserAvatar').mockResolvedValue(null);
    const store = createTestStore({
      user: {
        user: undefined,
      },
    });

    const result = await store.dispatch(refreshAvatarThunk());

    expect(result.payload).toBeUndefined();
    expect(store.getState().user.user).toBeUndefined();
  });
});
