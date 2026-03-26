import { UserService } from '@/services/user/user.service';
import type { RootState } from '@/store';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { userActions } from '../..';

export const refreshAvatarThunk = createAsyncThunk<UserSettings | undefined, void, { state: RootState }>(
  'user/refreshAvatar',
  async (_, { getState, dispatch }) => {
    const userAvatar = await UserService.instance.refreshUserAvatar();
    const user = getState().user.user;

    if (!user || !userAvatar) return undefined;

    dispatch(
      userActions.setUser({
        ...user,
        avatar: userAvatar,
      }),
    );
  },
);
