import { AuthService } from '@/services/sdk/auth';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { userActions } from '../..';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import type { RootState } from '@/store';

export const logoutThunk = createAsyncThunk<void, void, { state: RootState }>(
  'user/logout',
  async (_: void, { dispatch }) => {
    await AuthService.instance.logOut();

    dispatch(userActions.resetState());
    NavigationService.instance.navigate({ id: AppView.Welcome });
  },
);
