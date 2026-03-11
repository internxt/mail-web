import type { RootState } from '@/store';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { setIsUserInitialized } from '../..';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';

export const initializeUserThunk = createAsyncThunk<
  void,
  { redirectToLogin: boolean } | undefined,
  { state: RootState }
>('user/initialize', async (_, { dispatch, getState }) => {
  const { user, isAuthenticated } = getState().user;

  if (user && isAuthenticated) {
    dispatch(setIsUserInitialized(true));
  } else {
    NavigationService.instance.navigate(AppView.welcome);
  }
});
