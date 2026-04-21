import { AuthService } from '@/services/sdk/auth';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { userActions } from '../..';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import type { RootState } from '@/store';
import { ErrorService } from '@/services/error';

export const logoutThunk = createAsyncThunk<void, void, { state: RootState }>(
  'user/logout',
  async (_: void, { dispatch }) => {
    try {
      await AuthService.instance.logOut();
    } catch (err: unknown) {
      const castedError = ErrorService.instance.castError(err);
      console.error('ERROR WHILE LOGGING OUT: ', castedError.message, castedError.requestId);
    }

    NavigationService.instance.navigate({ id: AppView.Welcome });
    dispatch(userActions.resetState());
  },
);
